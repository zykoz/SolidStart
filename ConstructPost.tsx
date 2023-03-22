import { Accessor, createEffect, createMemo, createSignal, For, onCleanup, onMount } from "solid-js";
import { Dynamic } from "solid-js/web";
import { marked } from "marked";
import { markedEmoji } from "marked-emoji";

import styles from "./ConstructPost.module.css";
import hljs from "highlight.js";

interface Emoji {
    [key: string]: string;
}

export default async function ConstructPost() {
    onMount(() => {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "//cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/styles/atom-one-light.min.css";
        document.head.appendChild(link);

        const script = document.createElement("script");
        script.src = "//cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/highlight.min.js";
        document.head.appendChild(script);

        marked.setOptions({
            renderer: new marked.Renderer(),
            highlight: function (code, lang) {
                const language = hljs.getLanguage(lang) ? lang : "plaintext";
                return hljs.highlight(code, { language }).value;
            },
            langPrefix: "hljs language-", // highlight.js css expects a top-level 'hljs' class.
            pedantic: true,
            gfm: true,
            breaks: true,
            smartypants: true,
            xhtml: true,
            smartLists: true,
            async: true,
        });
    }); // End of onMount()
    const [markdown, setMarkdown] = createSignal("");
    const [html, setHtml] = createSignal("");

    const [showEmojiList, setShowEmojiList] = createSignal(true);
    const [searchEmojiTitle, setSearchEmojiTitle] = createSignal("");
    const [markdownLastChar, setMardownLastChar] = createSignal("");

    let unorderedListItemsMemo: Accessor<HTMLCollection> | (() => { title: string }[]);

    // fetch data asynchronously and create list items
    const dataFromAPI = await fetchEmojiDataFromAPI();
    const listElsFromAPI = createListItemsFromData(dataFromAPI);
    unorderedListItemsMemo = createMemo(() => listElsFromAPI);
    const [showElement, setShowElement] = createSignal(true);

    // create a memoized value based on the signal
    const dynamicElement = createMemo(() => {
        if (showElement()) {
            // return the dynamic element as a component
            return () => (
                <ul id='markdownEmojiList' class='bg-darker-100 w-max cursor-pointer dark:bg-darker-600 dark:text-darker-50 border focus:border-red-700'>
                    <span>EMOJI MATCHING:{searchEmojiTitle()}</span>
                    <For each={unorderedListItemsMemo() as HTMLLIElement[]} fallback={<div>Loading...</div>}>
                        {(item) => <>{item}</>}
                    </For>
                </ul>
            );
        }
    });

    // cleanup function to remove the dynamic element when showElement is set to false
    createEffect(() => {
        onCleanup(() => {
            if (!showElement()) {
                const container = document.querySelector(".dynamic-element-container");
                container?.firstChild && container.removeChild(container.firstChild);
            }
        });
    });

    // function to toggle the showElement signal
    const toggleShowElement = () => setShowElement(!showElement());

    function createListItemsFromData(data: Emoji) {
        let index: number = 0;
        const listItems = [];

        for (const key in data) {
            let ListEl: HTMLLIElement = document.createElement("li");
            let SpanElEmoji: HTMLSpanElement = document.createElement("span");
            let SpanElText: HTMLSpanElement = document.createElement("span");

            ListEl.setAttribute("title", key);
            ListEl.setAttribute("tabindex", `${index}`);
            SpanElEmoji.classList.add("w-[50px]", "inline-block", "text-center");
            SpanElEmoji.textContent = data[key];
            SpanElText.textContent = ":" + key + ":";
            ListEl.appendChild(SpanElEmoji);
            ListEl.appendChild(SpanElText);
            listItems.push(ListEl);
        }

        return listItems;
    }

    async function fetchEmojiDataFromAPI() {
        return fetch("https://emoji-api.com/emojis?access_key=7045da4d1db20887df16cb32ad6af6a07873c4a4")
            .then((res) => res.json())
            .then((data) => {
                const emojis = data.reduce((acc: any, { slug, character }: Emoji) => {
                    return { ...acc, [slug]: character };
                }, {});
                const options = {
                    emojis,
                    unicode: true,
                };
                marked.use(markedEmoji(options));
                document.getElementById("markdownTextArea")?.addEventListener("input", handleMarkdownChange);
                return emojis;
            });
    }

    function handleMarkdownChange(e: Event) {
        const markdownText = (e.target as HTMLTextAreaElement).value;
        setMardownLastChar(markdownText[markdownText.length - 1]);

        if (markdownLastChar() === ":") {
            // toggle list add event listener
            setSearchEmojiTitle(""); // reset start with nothing
            setShowEmojiList(!showEmojiList()); // toggle the emoji list
            showEmojiList() ? window.addEventListener("keydown", keyDownHandler) : window.removeEventListener("keydown", keyDownHandler);
        } else {
            (e as InputEvent).inputType === "deleteContentBackward"
                ? setSearchEmojiTitle(searchEmojiTitle().slice(0, -1)) // delete last character emojititlesignal
                : showEmojiList() && markdownLastChar() !== undefined && setSearchEmojiTitle(searchEmojiTitle() + markdownLastChar()); // add last character

            for (let i = 0; i < unorderedListItemsMemo().length; i++) {
                (unorderedListItemsMemo()[i] as HTMLLIElement).getAttribute("title")?.toLowerCase().includes(searchEmojiTitle())
                    ? ((unorderedListItemsMemo()[i] as HTMLLIElement).style.display = "block")
                    : ((unorderedListItemsMemo()[i] as HTMLLIElement).style.display = "none");
            }
        }

        setMarkdown(markdownText); // markdown text itself
        setHtml(marked(markdownText)); // html for jsx elem
        hljs.highlightAll();
    }

    function addTextToTextArea(textAreaElement: HTMLTextAreaElement, textToAdd: string) {
        let num = searchEmojiTitle().length * -1; // ommit last text from textarea, could maybe handle another way
        if (searchEmojiTitle()) textAreaElement.value = textAreaElement.value.slice(0, num);
        textAreaElement.value += textToAdd;
        setShowEmojiList(false); // done action so close the list
    }

    function keyDownHandler(e: KeyboardEvent) {
        let focusedIndex = 0;

        if (e.key === "Tab") {
            e.preventDefault();
            const textArea = document.getElementById("markdownTextArea") as HTMLTextAreaElement;
            // Create a new input event
            const inputEvent = new Event("input", { bubbles: true });
            setSearchEmojiTitle(":" + (unorderedListItemsMemo()[focusedIndex] as HTMLLIElement).title + ":");
            addTextToTextArea(textArea, searchEmojiTitle());
            setShowEmojiList(!showEmojiList());
            // Dispatch the input event on the text area
            textArea.dispatchEvent(inputEvent);
            textArea.focus();
            return;
        }
        // Check if the list is focused
        if (e.key === "ArrowDown" || e.key === "Down") {
            // Move focus down
            focusedIndex++;
            if (unorderedListItemsMemo() && focusedIndex >= unorderedListItemsMemo().length) {
                focusedIndex = 0; // Wrap back to the top
            }
        } else if (e.key === "ArrowUp" || e.key === "Up") {
            // Move focus up
            focusedIndex--;
            if (unorderedListItemsMemo() && focusedIndex < 0) {
                focusedIndex = unorderedListItemsMemo().length - 1; // Wrap to the bottom
            }

            for (let i = 0; i < unorderedListItemsMemo().length; i++) {
                if (i === focusedIndex) {
                    (unorderedListItemsMemo()[i] as HTMLLIElement).classList.add("focused", "border", "border-red-700");
                } else {
                    (unorderedListItemsMemo()[i] as HTMLLIElement).classList.remove("focused", "border", "border-red-700");
                }
            }
        }
    }

    return (
        <>
            <div class='dark:bg-darker-700 border border-darker-100 rounded flex mb-4 p-2 w-full justify-between bg-white dark:border-darker-400/70'>
                <div class='w-full h-max dark:text-darker-50 dark:bg-darker-600'>
                    <textarea id='markdownTextArea' value={markdown()} rows='10' class='w-full dark:text-darker-50 dark:bg-darker-600' />
                    <pre id='pre' innerHTML={html()} class={styles.post} />
                </div>
            </div>
            <div class='dynamic-element-container'>
                {/* render the dynamic element using the Dynamic component */}
                <Dynamic component={dynamicElement} />
            </div>
        </>
    );
}
