import axios from "axios";

export const BASE_URL = import.meta.env.BASE_URL || "/";

export const getHtmlFromString = (htmlString) => {
  const element = new DOMParser().parseFromString(htmlString, "text/html");
  return element.documentElement.querySelector("body").firstChild;
};

export const pageLoader = async (listOfFiles) => {
  // TODO: Handle showing loading percentage
  const loadingElement = getHtmlFromString(`<div id="page-loader">
      <div class="loading-circle"></div>
    </div>`);
  document.body.appendChild(loadingElement);

  const results = await axios.all(listOfFiles.map(axios.get));
  // TODO: Handle request fail and retry
  loadingElement.remove();
  return results.map((r) => r.data);
};

export const perc2color = (perc) => {
  const [r, g, b] = [Math.round(2.55 * (100 - perc)), 255, 0];
  const h = r * 0x10000 + g * 0x100 + b * 0x1;
  return "#" + ("000000" + h.toString(16)).slice(-6);
};
