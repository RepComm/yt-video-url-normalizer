
export interface QueryInfo {
  [key: string]: string | Array<string>;
}
export interface URLInfo {
  base: string;
  query: string;
  queryParams: QueryInfo;
}

export function decomposeUrl(urlStr: string, allowDuplicateParamKeys: boolean = true) {
  //split the base url from the query
  let [base, query] = urlStr.split("?");

  //create a result that we'll return later
  let result: URLInfo = {
    base,
    query,
    queryParams: {} //parsed version of query
  };

  //split each param
  let paramStrs = query.split("&");

  for (let paramStr of paramStrs) {
    let [key, value] = paramStr.split("=");

    let existingValue = result.queryParams[key];

    //if param used multiple times, handle edge case
    if (allowDuplicateParamKeys && existingValue !== undefined && existingValue !== null) {
      if (Array.isArray(existingValue)) {
        existingValue.push(value);
      } else {
        existingValue = [existingValue, value];
      }
    } else {
      result.queryParams[key] = value;
    }

  }

  return result;
}
export function composeUrl(urlInfo: URLInfo, ...allowedKeys: string[]) {
  let result = urlInfo.base;

  let paramKeys = Object.keys(urlInfo.queryParams);

  let firstValueWritten = false;

  //loop over every param
  for (let i = 0; i < paramKeys.length; i++) {

    let key = paramKeys[i];
    let value = urlInfo.queryParams[key];

    if (allowedKeys && allowedKeys.length > 0 && allowedKeys.includes(key)) {
      //ternary ops would have been beautifully terse, but alas it was complicated when param keys used multiple times :(
      if (Array.isArray(value)) {
        for (let j = 0; j < value.length; j++) {
          let v = value[j];
          if (firstValueWritten) {
            result += `&${key}=${v}`;
          } else {
            firstValueWritten = true;
            result += `?${key}=${v}`;
          }
        }
      } else {
        if (firstValueWritten) {
          result += `&${key}=${value}`;
        } else {
          firstValueWritten = true;
          result += `?${key}=${value}`;
        }
      }
    }

  }
  return result;
}


import { exponent, UIBuilder } from "./ui.js";

function convert(text: string) {

  let urls = text.split(/\s/);
  let results = new Array<string>();

  for (let url of urls) {
    let videoId = undefined;

    url = url.trim();
    if (url === "") continue;

    if (url.includes("youtu.be/")) {
      url = url.substring(url.indexOf("youtu.be"));
      let [base, _videoId] = url.split("/");
      videoId = _videoId;
    } else {
      let info = decomposeUrl(url, false);
      videoId = info.queryParams["v"];
    }

    results.push(`www.youtube.com/watch?v=${videoId}`);
  }
  return results;
}

async function main() {
  let doc = document;

  let ui = new UIBuilder();

  ui.default(exponent);

  let vsplit = ui.create("div").style({
    flexDirection: "column"
  }).mount(doc.body).e;

  let hsplit = ui.create("div").style({
    flexDirection: "row",
    flex: "10",
  }).mount(vsplit).e;

  let _input = ui.create("textarea").style({
    width: "50%",
    borderColor: "black",
    borderStyle: "solid",
    borderWidth: "1px",
    margin: "0.5em",
    borderRadius: "0.5em"
  }).mount(hsplit).e;
  _input.spellcheck = false;

  let _output = ui.create("table").style({
    width: "50%",
    borderColor: "black",
    borderStyle: "solid",
    borderWidth: "1px",
    height: "min-content",
    margin: "0.5em",
    borderRadius: "0.5em"
  }).mount(hsplit).e;

  let _generate = ui.create("button")
  .style({
    flex: "1",
    margin: "0.5em",
    borderRadius: "0.5em",
    backgroundColor: "#99c199"
  })
  .textContent("Generate")
  .mount(vsplit)
  .on("click", (evt) => {
    //clear output
    while (_output.childElementCount > 0) {
      _output.removeChild(_output.firstChild);
    }

    //parse input
    let urls = convert(_input.value);

    //render output
    for (let url of urls) {
      let row = ui.create("tr")
      .style({
        borderBottomStyle: "dashed",
        borderBottomWidth: "1px",
        borderBottomColor: "gray"
      })
      .mount(_output).e;

      let item = ui.create("td").mount(row).e;
      let link = ui.create("a").mount(item)
      .e;

      link.href = `https://${url}`;
      link.textContent = url;
    }
  }).e;
}

main();
