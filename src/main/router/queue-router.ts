import { Router } from '../lib/route-pass/Router';
import { QueueCreatePayload, QueueView, Song, SongIndex } from '../../@types';
import { Storage } from '../lib/storage/Storage';
import { filter } from '../lib/song/filter';
import { indexMapper } from '../lib/song/indexMapper';
import { mainWindow } from '../main';
import order from '../lib/song/order';
import errorIgnored from '../lib/tungsten/errorIgnored';



let queue: Song[];
let index = 0;
let lastPayload: QueueCreatePayload | undefined;

Router.respond("queue.create", async (_evt, payload) => {
  if (comparePayload(payload, lastPayload)) {
    const newIndex = queue.findIndex(s => s.path === payload.startSong);

    if (newIndex === -1 || newIndex === index) {
      return;
    }

    index = newIndex;
    lastPayload = payload;
    await Router.dispatch(mainWindow, "queue.songChanged", queue[index])
      .catch(errorIgnored);
    return;
  }

  lastPayload = payload;
  queue = Array.from(indexMapper(filter(getIndexes(payload.view), payload)));

  const ordering = order(payload.order);

  if (!ordering.isError) {
    queue.sort(ordering.value);
  }

  const songIndex = queue.findIndex(s => s.path === payload.startSong);

  if (songIndex !== -1) {
    index = songIndex;
  } else {
    index = 0;
  }

  await Router.dispatch(mainWindow, "queue.songChanged", queue[index])
    .catch(errorIgnored);
});

function getIndexes(view: QueueView): SongIndex[] {
  if (view.playlists !== undefined) {
    //todo implement multi playlist playback
    return [];
  }

  if (view.isAllSongs) {
    const indexes = Storage.getTable("system").get("indexes");
    if (indexes.isNone) {
      return [];
    }

    return indexes.value;
  }

  if (view.isQueue) {
    //todo maybe just forward pointer? This should not happen
    return [];
  }

  if (view.playlist) {
    //todo get playlist
    return [];
  }

  return [];
}

function comparePayload(current: QueueCreatePayload, last: QueueCreatePayload | undefined): boolean {
  if (last === undefined) {
    return false;
  }

  if (typeof current.searchQuery !== typeof last.searchQuery) {
    return false;
  }

  if (current.searchQuery !== undefined && last.searchQuery !== undefined) {
    if (current.searchQuery.query !== last.searchQuery.query) {
      return false;
    }
  }

  if (current.order !== last.order) {
    return false;
  }

  if (JSON.stringify(current.view) !== JSON.stringify(last.view)) {
    return false;
  }

  if (current.tags.length !== last.tags.length) {
    return false;
  }

  return JSON.stringify(current.tags) === JSON.stringify(last.tags);
}



Router.respond('queue.current', () => {
  return queue[index];
});

Router.respond('queue.previous', () => {
  if (--index < 0) {
    index = queue.length;
  }
});

Router.respond('queue.next', () => {
  if (++index === queue.length) {
   index = 0;
  }
});