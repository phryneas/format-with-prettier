import { defaultOptions, getOption, getOptions, ExtensionOptions, setOption } from "../options";
import { parsersByName } from "../plugins";
import { FormatRequest, FormatResponse } from "../types";

init().catch((e) => {
  console.error("error in options page", e.toString());
});

async function init() {
  const $checkboxTemplate = document.getElementById("checkbox-template")! as HTMLTemplateElement;
  const $parsers = document.getElementById("parsers")!;
  const $other = document.getElementById("other")!;
  const $prettierOptions: HTMLTextAreaElement = document.querySelector('[name="prettier-options"]')!;
  const $prettierOptionsReset = document.getElementById("prettier-options-reset")!;
  const $prettierOptionsErrors = document.getElementById("prettier-options-errors")!;

  $prettierOptionsReset.onclick = () => {
    if (confirm("do you really want to reset the prettier options to the default value?")) {
      $prettierOptions.value = defaultOptions.prettierOptions;
      $prettierOptions.onblur?.(new FocusEvent("blur"));
    }
  };

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
      const request: FormatRequest = {
        code: $prettierOptions.value,
        options: { parser: "json5" },
        unparsedOptions: value,
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

  addCheckbox({
    label: "alert on error",
    checked: options.alertOnFormatError,
    onChange(newValue) {
      setOption("alertOnFormatError", newValue);
    },
    parent: $other,
  });
  addCheckbox({
    label: "rethrow ebmed errors",
    checked: options.rethrowEmbedErrors,
    onChange(newValue) {
      setOption("rethrowEmbedErrors", newValue);
    },
    parent: $other,
  });

  for (const parser of Object.values(parsersByName)) {
    addCheckbox({
      label: `${parser.parser}: ${parser.description} (${parser.pluginName})`,
      async onChange(newValue) {
        const oldParsers = await getOption("enabledParsers");
        await setOption("enabledParsers", newValue ? oldParsers.concat(parser.parser) : oldParsers.filter((p) => p != parser.parser));
      },
      checked: options.enabledParsers.includes(parser.parser),
      parent: $parsers,
    });
  }

  function addCheckbox({
    label,
    onChange,
    checked,
    parent,
  }: {
    label: string;
    onChange: (newValue: boolean) => void;
    checked: boolean;
    parent: HTMLElement;
  }) {
    const $elem = document.importNode($checkboxTemplate.content, true);

    const $label = $elem.querySelector(".description")!;
    const $input: HTMLInputElement = $elem.querySelector("input")!;

    $label.textContent = label;
    $input.checked = checked;
    $input.onchange = () => onChange($input.checked);
    parent.append($elem);
  }
}
