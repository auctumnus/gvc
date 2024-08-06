import { isSameDay } from "https://esm.sh/date-fns/isSameDay";

const ts = (d) =>
  d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
const ds = (d) =>
  d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "long",
    day: "numeric",
  });

class DisplayTimeElement extends HTMLElement {
  static observedAttributes = ["start", "end"];

  render() {
    const span = document.createElement("span");
    const start = new Date(parseInt(this.getAttribute("start")));
    const end = new Date(parseInt(this.getAttribute("end")));

    if (isSameDay(start, end)) {
      span.innerHTML = `${ds(start)} <span class="nowrap">${ts(start)}</span> - <span class="nowrap">${ts(end)}</span>`;
    } else {
      span.innerHTML = `${ds(start)} <span class="nowrap">${ts(start)}</span> - ${ds(end)} <span class="nowrap">${ts(end)}</span>`;
    }

    return span;
  }

  connectedCallback() {
    this.innerHTML = "";
    this.appendChild(this.render());
  }

  attributeChangedCallback(_, __, ___) {
    this.innerHTML = "";
    this.appendChild(this.render());
  }
}

customElements.define("display-time", DisplayTimeElement);
