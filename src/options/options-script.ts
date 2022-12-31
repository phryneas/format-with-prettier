import { getOption, getOptions, onOptionChange, setOption } from "../options";
import { parsersByName } from "../plugins";
import { FormatRequest, FormatResponse } from "../types";

init().catch((e) => {
  console.error("error in options page", e.toString());
});

async function init() {
  const $template = document.getElementById("parser-template")! as HTMLTemplateElement;
  const $parsers = document.getElementById("parsers")!;
  const $prettierOptions: HTMLTextAreaElement = document.querySelector('[name="prettier-options"]')!;
  const $prettierOptionsErrors = document.getElementById("prettier-options-errors")!;

  const options = await getOptions();

  function resizeOptionsTextarea() {
    $prettierOptions.rows = $prettierOptions.value.split("\n").length + 1;
  }
  $prettierOptions.onkeydown = resizeOptionsTextarea;
  $prettierOptions.value = options.prettierOptions;
  resizeOptionsTextarea();
  $prettierOptions.onblur = async () => {
    try {
      const value = $prettierOptions.value;
      const parsedOptions = JSON.parse(value);
      const request: FormatRequest = {
        code: $prettierOptions.value,
        options: { ...parsedOptions, parser: "json" },
      };
      const response: FormatResponse = await browser.runtime.sendMessage(request);
      await setOption("prettierOptions", response.formatted);
      if (response.error) {
        alert(response.error);
      } else {
        $prettierOptions.value = response.formatted;
        resizeOptionsTextarea();
      }

      $prettierOptionsErrors.innerText = "";
    } catch (e) {
      $prettierOptionsErrors.innerText = `Error while saving settings: 
${e?.toString()}`;
    }
  };

  for (const parser of Object.values(parsersByName)) {
    const $elem = document.importNode($template.content, true);

    const $description = $elem.querySelector(".description")!;
    const $input: HTMLInputElement = $elem.querySelector("input")!;

    $description.textContent = `${parser.description} (${parser.pluginName})`;

    $input.onchange = async () => {
      const oldParsers = await getOption("enabledParsers");
      if (!$input.checked) {
        await setOption(
          "enabledParsers",
          oldParsers.filter((p) => p != parser.parser)
        );
      } else {
        await setOption("enabledParsers", oldParsers.concat(parser.parser));
      }
    };
    if (options.enabledParsers.includes(parser.parser)) {
      $input.checked = true;
    }

    $parsers.append($elem);
  }
}
