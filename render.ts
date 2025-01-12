import React from "react";
import ReactDOMServer from "react-dom/server";
import fs from "fs";
import HoldingPage from "@/app/HoldingPage";

const html = ReactDOMServer.renderToStaticMarkup(
  React.createElement(HoldingPage)
);

const fullHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>BandFlow</title>
    <link rel="stylesheet" href="./styles.css" />
  </head>
  <body>
    <div id="root">${html}</div>
  </body>
</html>`;

fs.writeFileSync("index.html", fullHtml, "utf8");
console.log("index.html has been generated!");
