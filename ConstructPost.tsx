import { createSignal, onMount } from "solid-js";
import { marked } from "marked";
import { markedEmoji } from "marked-emoji";

import styles from "./ConstructPost.module.css";
import hljs from "highlight.js";

interface Emoji {
    [key: string]: string;
}

export default function ConstructPost(props: any) {
    const [markdown, setMarkdown] = createSignal("");
    const [html, setHtml] = createSignal("");

    const [showEmojiList, setShowEmojiList] = createSignal(true);
    const [searchEmojiTitle, setSearchEmojiTitle] = createSignal("");
    const [markdownLastChar, setMardownLastChar] = createSignal("");

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

        fetch("https://emoji-api.com/emojis?access_key=7045da4d1db20887df16cb32ad6af6a07873c4a4")
            .then((res) => res.json())
            .then((data) => {
                const emojis = data.reduce((acc: any, { slug, character }: any) => {
                    return { ...acc, [slug]: character };
                }, {});
                const options = {
                    emojis,
                    unicode: true,
                };
                marked.use(markedEmoji(options));
                loadEmoji(emojis);
                document.getElementById("markdownTextArea")?.addEventListener("input", handleMarkdownChange);
            });
    });

    function handleMarkdownChange(e: any) {
        // last to be called on mount
        const markdownText = e.target.value;
        setMardownLastChar(markdownText[e.target.value.length - 1]);
        if (markdownLastChar() === ":") {
            // toggle list add event listener
            setSearchEmojiTitle(""); // reset start with nothing
            setShowEmojiList(!showEmojiList()); // toggle the emoji list
            showEmojiList() ? window.addEventListener("keydown", func) : window.removeEventListener("keydown", func);
        } else {
            e.inputType === "deleteContentBackward"
                ? setSearchEmojiTitle(searchEmojiTitle().slice(0, -1)) // delete last character emojititlesignal
                : showEmojiList() && markdownLastChar() !== undefined && setSearchEmojiTitle(searchEmojiTitle() + markdownLastChar()); // add last character

            document.querySelectorAll("#markdownEmojiList li").forEach((emoji: any) => {
                emoji.getAttribute("title")?.toLowerCase().includes(searchEmojiTitle()) ? (emoji.style.display = "block") : (emoji.style.display = "none");
            });
        }

        setMarkdown(markdownText); // markdown text itself
        setHtml(marked(markdownText)); // html for jsx elem
        hljs.highlightAll();
    }

    function loadEmoji(data: Emoji) {
        // second last in onMount
        let index = 0;
        const markdownEmojiList = document.getElementById("markdownEmojiList");

        for (const key in data) {
            index++;
            let newLi = document.createElement("li");
            let newI = document.createElement("span");
            let newSpan = document.createElement("span");

            newLi.setAttribute("title", key);
            newLi.setAttribute("tabindex", `${index}`); // want to be able to use tab key to go through emoji list // focus will have problems because we use an index var
            newI.classList.add("w-[50px]", "inline-block", "text-center");
            newI.textContent = data[key];
            newSpan.textContent = ":" + key + ":";
            newLi.appendChild(newI);
            newLi.appendChild(newSpan);

            markdownEmojiList && markdownEmojiList.appendChild(newLi);
        }

        return markdownEmojiList && markdownEmojiList.querySelectorAll("li");
    }

    function addTextToTextArea(textAreaElement: HTMLTextAreaElement, textToAdd: string) {
        let num = searchEmojiTitle().length * -1; // ommit last text from textarea, could maybe handle another way
        if (searchEmojiTitle()) textAreaElement.value = textAreaElement.value.slice(0, num);
        textAreaElement.value += textToAdd;
        setShowEmojiList(false); // done action so close the list
    }

    const func = (e: any) => {
        let focusedIndex = 0;
        const listItems = document.querySelectorAll("#markdownEmojiList li");

        if (e.key === "Tab") {
            e.preventDefault();
            const textArea = document.getElementById("markdownTextArea") as HTMLTextAreaElement;
            // Create a new input event
            const inputEvent = new Event("input", { bubbles: true });
            setSearchEmojiTitle(":" + listItems[focusedIndex]?.title + ":");
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
            if (listItems && focusedIndex >= listItems.length) {
                focusedIndex = 0; // Wrap back to the top
            }
        } else if (e.key === "ArrowUp" || e.key === "Up") {
            // Move focus up
            focusedIndex--;
            if (listItems && focusedIndex < 0) {
                focusedIndex = listItems.length - 1; // Wrap to the bottom
            }

            listItems.forEach((item, index) => {
                if (index === focusedIndex) {
                    item.classList.add("focused", "border", "border-red-700");
                } else {
                    item.classList.remove("focused", "border", "border-red-700");
                }
            });
        }
    };

    return (
        <>
            <div class='dark:bg-darker-700 border border-darker-100 rounded flex mb-4 p-2 w-full justify-between bg-white dark:border-darker-400/70'>
                <div class='w-full h-max dark:text-darker-50 dark:bg-darker-600'>
                    <textarea id='markdownTextArea' value={markdown()} rows='10' class='w-full dark:text-darker-50 dark:bg-darker-600' />
                    <pre id='pre' innerHTML={html()} class={styles.post} />
                </div>
            </div>
            {showEmojiList() && (
                <ul id='markdownEmojiList' class='bg-darker-100 w-max cursor-pointer dark:bg-darker-600 dark:text-darker-50 border focus:border-red-700'>
                    <span>EMOJI MATCHING:{searchEmojiTitle()}</span>
                </ul>
            )}
        </>
    );
}
