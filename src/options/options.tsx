import { h, render } from "preact";
import { useEffect, useState } from "preact/hooks";
import { LanguageCode, OpenAIModel } from "../types/types";
import { languageCodeToString } from "../presenter";

function Options() {
  const [summaryLength, setSummaryLength] = useState(100);
  const [model, setModel] = useState(OpenAIModel.GPT_3_5_Turbo);
  const [targetLang, setTargetLang] = useState<LanguageCode>(LanguageCode.EN);
  const [apiKey, setApiKey] = useState("");

  // useEffect to get the values from chrome storage and update local state
  useEffect(() => {
    chrome.storage.sync.get("summaryLength", (data) => {
      if (data.summaryLength) {
        setSummaryLength(data.summaryLength);
      }
    });
    chrome.storage.sync.get("apiKey", (data) => {
      if (data.apiKey) {
        setApiKey(data.apiKey);
      }
    });
    chrome.storage.sync.get("model", (data) => {
      if (data.model) {
        setModel(data.model);
      }
    });

    chrome.storage.sync.get("targetLang", (data) => {
      console.log(data.targetLang);
      if (data.targetLang) {
        setTargetLang(data.targetLang);
      }
    });
  }, []);

  const handleApiKeyChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const newApiKey = target.value;
    if (!newApiKey) {
      alert("API key is required");
      return;
    }
    setApiKey(newApiKey);

    // Save the API key to Chrome storage
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.sync.set({ apiKey: newApiKey }, () => {
        if (chrome.runtime.lastError) {
          alert(
            `Error saving API key: ${chrome.runtime.lastError.message}. Please try again.`
          );
          return;
        }
        console.log("API key saved:", newApiKey);
      });
    }
  };

  const handleSummaryLengthChange = (event: any) => {
    const newSummaryLength = event.target.value;
    setSummaryLength(newSummaryLength);
    chrome.storage.sync.set({ summaryLength: newSummaryLength });
  };

  const handleModelChange = (event: any) => {
    setModel(event.target.value);
    chrome.storage.sync.set({ model: model });
  };

  const handleTargetLangChange = (event: any) => {
    chrome.storage.sync.set({ targetLang: event.target.value });
    setTargetLang(event.target.value);
  };

  return (
    <div className="m-4 w-96 mx-auto h-full bg-white rounded-lg shadow-md p-6">
      <h1 className="text-lg font-bold mb-4">ChatGPT Summarizer Options</h1>
      <p className="text-gray-700 mb-4">
        Customize the behavior of the ChatGPT Summarizer extension:
      </p>
      <form>
        <div className="mb-4">
          <label class="block text-gray-700 font-bold mb-2" for="api-key">
            API Key:
          </label>
          <input
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="api-key"
            type="text"
            value={apiKey}
            onInput={handleApiKeyChange}
          />
        </div>
        <div className="mb-4">
          <label
            className="block text-gray-700 font-bold mb-2"
            htmlFor="summary-length"
          >
            Summary Length:
          </label>
          <select
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="summary-length"
            name="summary-length"
            value={summaryLength}
            selected={true}
            onChange={handleSummaryLengthChange}
          >
            <option value="100">100</option>
            <option value="200">200</option>
            <option value="300">300</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 font-bold mb-2" htmlFor="model">
            Model:
          </label>
          <select
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="model"
            name="model"
            value={model}
            onChange={handleModelChange}
          >
            <option value={OpenAIModel.GPT_3_5_Turbo}>
              {OpenAIModel.GPT_3_5_Turbo}
            </option>
            <option value={OpenAIModel.GPT_4}>{OpenAIModel.GPT_4}</option>
          </select>
        </div>{" "}
        <div className="mb-4">
          <label
            className="block text-gray-700 font-bold mb-2"
            htmlFor="targetLang"
          >
            Target Language:
          </label>
          <select
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="targetLang"
            name="targetLang"
            value={targetLang}
            onChange={handleTargetLangChange}
          >
            {Object.values(LanguageCode).map((languageCode) => (
              <option value={languageCode}>
                {languageCodeToString(languageCode)}
              </option>
            ))}
          </select>
        </div>
      </form>
    </div>
  );
}

render(<Options />, document.body);
