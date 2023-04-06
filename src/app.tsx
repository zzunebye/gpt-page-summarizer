import { FunctionComponent } from "preact";
import { useEffect, useState } from "preact/hooks";
import { LanguageCode, OpenAIModel } from "./types/types";
import { getArticle, summarizeArticle } from "./utils";
import * as chromeApi from "./services/chromeApi";
import * as process from "process";
import dotenv from "dotenv";
import { languageCodeToString } from "./presenter";

export const App: FunctionComponent = () => {
  const [apiKey, setApiKey] = useState("");
  const [summary, setSummary] = useState("");
  const [summaryLength, setSummaryLength] = useState(100);
  const [targetLang, setTargetLang] = useState<LanguageCode>(LanguageCode.EN);
  const [model, setModel] = useState(OpenAIModel.GPT_3_5_Turbo);
  const [isLoading, setLoading] = useState(false);
  const [hasSummarized, setHasSummarized] = useState(false);

  useEffect(() => {
    // Retrieve the API key from Chrome storage
    if (typeof chrome !== "undefined" && chrome.storage) {
      chromeApi.getValueFromStorage("apiKey", setApiKey);
    }

    chrome.storage.sync.get(["summaryLength"], (result) => {
      if (result.summaryLength) {
        setSummaryLength(result.summaryLength);
      }
    });

    chrome.storage.sync.get(["targetLang"], (result) => {
      if (result.targetLang) {
        setTargetLang(result.targetLang);
      }
    });
  }, []);

  const clearSummary = () => {
    setSummary("");
  };

  const handleSummarizeClick = () => {
    setLoading(true);
    clearSummary();

    const maxCodeLength = model === OpenAIModel.GPT_3_5_Turbo ? 6000 : 12000;

    if (!apiKey) {
      alert("Please enter an API key.");
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const activeTab = tabs[0];
      try {
        if (activeTab && activeTab.url) {
          const url = activeTab.url;
          console.log("Active tab URL:", url);

          const article = await getArticle(url);

          if (!article) {
            setLoading(false);
            alert("Something went wrong.");
            return;
          }

          // Call the ChatGPT API with the URL
          const stream = await summarizeArticle(
            url,
            apiKey,
            OpenAIModel.GPT_3_5_Turbo,
            controller,
            article,
            {
              summaryLength: summaryLength,
              targetLang: languageCodeToString(targetLang),
            }
          );

          if (!stream) {
            setLoading(false);
            alert("Something went wrong.");
            return;
          }

          const reader = stream.getReader();
          const decoder = new TextDecoder();
          let done = false;
          let summary = "";

          while (!done) {
            const { value, done: doneReading } = await reader.read();
            done = doneReading;
            if (value) {
              const chunkValue = decoder.decode(value);
              summary += chunkValue;
              setSummary((prevCode) => prevCode + chunkValue);
            }
          }
          setHasSummarized(true);
          copyToClipboard(summary);
          setLoading(false);
        }
      } catch (error) {
        console.log("error!");
        setLoading(false);
        console.error(error);
        alert(`Something went wrong: ${error}`);
      }
    });
  };

  const copyToClipboard = (text: string) => {
    const el = document.createElement("textarea");
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
  };

  return (
    <div class="p-4 w-96 flex flex-col" style={"height: 32rem"}>
      <div class={"flex flex-row mb-4 justify-between"}>
        <h1 class="text-xl">ChatGPT Summarizer</h1>
        <button
          class=""
          onClick={() => {
            if (chrome.runtime.openOptionsPage) {
              chrome.runtime.openOptionsPage();
            } else {
              window.open(chrome.runtime.getURL("options.html"));
            }
          }}
        >
          Options
        </button>
      </div>

      <button
        class={`w-full mb-4 py-2 px-4 bg-blue-500 text-white font-semibold rounded ${
          isLoading ? "opacity-50 cursor-not-allowed" : ""
        }`}
        onClick={isLoading ? () => {} : handleSummarizeClick}
      >
        {isLoading ? "Loading..." : "Summarize Article"}
      </button>
      <div class="border border-gray-300 rounded p-4 w-full flex flex-col flex-1 overflow-y-scroll">
        <h2 class="text-lg mb-2">Summary:</h2>
        {/* ;; if summary is empty, show placeholder message at the center of the div */}
        <div class="flex flex-col flex-1">
          {summary === "" && !hasSummarized ? (
            <div class="flex flex-col items-center justify-center h-full">
              <p class="text-gray-400 text-sm">No summary found.</p>
            </div>
          ) : (
            <p class="font-base">{summary}</p>
          )}
        </div>
      </div>
    </div>
  );
};
