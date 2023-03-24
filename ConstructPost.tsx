import { Accessor, createEffect, createMemo, createSignal, For, onMount, Show } from "solid-js";
import { marked } from "marked";
import { markedEmoji } from "marked-emoji";

import styles from "./ConstructPost.module.css";
import hljs from "highlight.js";

interface Emoji {
    [key: string]: string;
}

const [markdown, setMarkdown] = createSignal("");
const [html, setHtml] = createSignal("");

const [showEmojiList, setShowEmojiList] = createSignal(false);
const [searchEmojiTitle, setSearchEmojiTitle] = createSignal("");
const [emojiData, setEmojiData] = createSignal<Emoji | undefined>(undefined);

let unorderedListItemsMemo: Accessor<HTMLCollection> | (() => { title: string }[]);

export default function ConstructPost() {
    const emojiCodeRegex = /:\w+[-\w\d]*:/g;
    onMount(() => {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "//cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/styles/atom-one-light.min.css";
        document.head.appendChild(link);

        const script = document.createElement("script");
        script.src = "//cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/highlight.min.js";
        document.head.appendChild(script);

        fetch("https://emoji-api.com/emojis?access_key=7045da4d1db20887df16cb32ad6af6a07873c4a4")
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
                setEmojiData(emojis);
            });

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
        document.getElementById("markdownTextArea")?.addEventListener("input", handleTextareaInput);
        document.getElementById("markdownTextArea")?.addEventListener("focus", handleTextareaFocus);
        document.getElementById("markdownTextArea")?.addEventListener("blur", handleTextareaBlur);
    }); // End of onMount()

    let emojiCode: string = ""; // variable to hold the current emoji code being inputted
    let lastCursorPosition: number = 0; // variable to hold the last cursor position in the textarea

    const handleTextareaInput = (e: Event) => {
        const textarea = e.target as HTMLTextAreaElement;
        const currentPosition = textarea.selectionStart || 0;
        const inputValue = textarea.value.slice(0, currentPosition);
        const lastInput = inputValue.slice(-1);
        if ((e as InputEvent).inputType === "deleteContentBackward") {
            setSearchEmojiTitle(searchEmojiTitle().slice(0, -1)); // delete last character emojititlesignal
            handleListitemStyles(searchEmojiTitle());
            return;
        }
        if (lastInput === ":") {
            // start of emoji code
            emojiCode = ":";
            lastCursorPosition = currentPosition;
        } else if (emojiCode && lastInput.match(/[a-zA-Z0-9-]/)) {
            // inputting emoji code
            setSearchEmojiTitle(searchEmojiTitle() + lastInput);
            handleListitemStyles(searchEmojiTitle());
            if (
                searchEmojiTitle() &&
                searchEmojiTitle()
                    .slice(-2)
                    .match(/[a-zA-Z]{2}/)
            ) {
                setShowEmojiList(true);
            }
        } else {
            // clear emoji code
            setSearchEmojiTitle("");
            emojiCode = "";
        }
        if (lastCursorPosition === currentPosition && searchEmojiTitle() === "") {
            // user has deleted text
            setShowEmojiList(false);
        }
    };
    const handleTextareaFocus = () => {
        searchEmojiTitle() && setShowEmojiList(true);
    };

    const handleTextareaBlur = () => {
        setShowEmojiList(false);
    };

    function handleListitemStyles(match: string) {
        for (let i = 0; i < unorderedListItemsMemo().length; i++) {
            (unorderedListItemsMemo()[i] as HTMLLIElement).getAttribute("title")?.toLowerCase().includes(match[0])
                ? ((unorderedListItemsMemo()[i] as HTMLLIElement).style.display = "block")
                : ((unorderedListItemsMemo()[i] as HTMLLIElement).style.display = "none");
        }
    }

    function handleMarkdownChange(e: any) {
        setMarkdown(e.target?.value); // markdown text itself
        setHtml(marked(e.target?.value)); // html for jsx elem
        hljs.highlightAll();
    }

    function addTextToTextArea(textAreaElement: HTMLTextAreaElement, textToAdd: string) {
        let num = searchEmojiTitle().length * -1; // ommit last text from textarea, could maybe handle another way
        if (searchEmojiTitle()) textAreaElement.value = textAreaElement.value.slice(0, num);
        textAreaElement.value += textToAdd;
        setShowEmojiList(false); // done action so close the list
    }

    createEffect(() => {
        console.log("emojidatawasloaded");
        if (emojiData()) {
            createListItemsFromData(emojiData());
            document.getElementById("markdownTextArea")?.addEventListener("input", handleMarkdownChange);
        }
    });

    createEffect(() => {
        console.log("toggleeventlistener");
        // used for dynamically adding and removing listener for when list is available for being tabbed
        showEmojiList() ? document.addEventListener("keydown", keyDownHandler) : document.removeEventListener("keydown", keyDownHandler);
    });

    createEffect(() => {
        console.log(searchEmojiTitle());
    });

    function createListItemsFromData(data?: Emoji) {
        let index: number = 0;
        const listItems: HTMLLIElement[] = [];
        for (const key in data) {
            if (typeof document !== "undefined") {
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
        }
        unorderedListItemsMemo = createMemo(() => listItems);
    }

    function keyDownHandler(e: KeyboardEvent) {
        let focusedIndex = 0;
        if (e.key === "Tab") {
            e.preventDefault();
            if (typeof document !== "undefined") {
                const textArea = document.getElementById("markdownTextArea") as HTMLTextAreaElement;

                // Create a new input event
                const inputEvent = new Event("input", { bubbles: true });
                setSearchEmojiTitle((unorderedListItemsMemo()[focusedIndex] as HTMLLIElement).title);
                addTextToTextArea(textArea, ":" + searchEmojiTitle() + ":");
                setSearchEmojiTitle("");
                setShowEmojiList(false);
                // Dispatch the input event on the text area
                textArea.dispatchEvent(inputEvent);
                textArea.focus();
            }
            return;
        }
        if (e.key === "ArrowDown" || e.key === "Down") {
            focusedIndex++;
            if (unorderedListItemsMemo() && focusedIndex >= unorderedListItemsMemo().length) {
                focusedIndex = 0; // Wrap back to the top
            }
        } else if (e.key === "ArrowUp" || e.key === "Up") {
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
            <div class='mb-4 flex w-full justify-between rounded border border-darker-100 bg-white p-2 dark:border-darker-400/70 dark:bg-darker-700'>
                <div class='h-max w-full dark:bg-darker-600 dark:text-darker-50'>
                    <textarea id='markdownTextArea' value={markdown()} rows='10' class='w-full dark:bg-darker-600 dark:text-darker-50' />
                    <pre id='pre' innerHTML={html()} class={styles.post} />
                </div>
            </div>
            <Show when={showEmojiList()}>
                <ul id='markdownEmojiList' class='w-max cursor-pointer border bg-darker-100 focus:border-red-700 dark:bg-darker-600 dark:text-darker-50'>
                    <span>EMOJI MATCHING:{searchEmojiTitle()}</span>
                    <For each={unorderedListItemsMemo() as HTMLLIElement[]} fallback={<div>Loading...</div>}>
                        {(item) => <>{item}</>}
                    </For>
                </ul>
            </Show>
        </>
    );
}
