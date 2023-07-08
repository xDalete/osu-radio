import { Component, createSignal, onCleanup, onMount } from 'solid-js';
import { Song } from '../../../../@types';
import { availableResource, getResourcePath } from '../../lib/tungsten/resource';
import { averageBPM } from '../../lib/song';
import defaultBackground from "../../assets/osu-default-background.jpg";
import "../../assets/css/item.css";



const setSourceEvent = "setSource";

const lazy = new IntersectionObserver(async entries => {
  for (let i = 0; i < entries.length; i++) {
    if (entries[i].isIntersecting === false) {
      return;
    }

    const resource = await getResourcePath(String(entries[i].target.getAttribute("data-url")), "images");

    entries[i].target.dispatchEvent(new CustomEvent(setSourceEvent, {
      detail: await availableResource(resource, defaultBackground)
    }));

    lazy.unobserve(entries[i].target);
  }
}, { rootMargin: "50px" });



const Item: Component<{ song: Song }> = props => {
  const [src, setSRC] = createSignal(defaultBackground);

  let item;
  const setSource = evt => {
    setSRC(evt.detail);
    item.removeEventListener(setSourceEvent, setSource);
  };

  onMount(() => {
    item.addEventListener(setSourceEvent, setSource);
    lazy.observe(item);
  });

  onCleanup(() => {
    item.removeEventListener(setSourceEvent, setSource);
  });

  return (
    <div class="item" ref={item} data-url={props.song.bg}>
      <div class="image" style={{ 'background-image': `url(${src()})` }}></div>
      <div class="column">
        <h3>[{Math.round(60_000 / averageBPM(props.song.bpm, props.song.duration))} BPM] {props.song.title}</h3>
        <span>{props.song.artist}</span>
      </div>
    </div>
  );
}

export default Item;