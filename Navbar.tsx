import { createSignal, onCleanup, onMount, Show } from "solid-js";
import { A, useLocation } from "solid-start";
import { createServerAction$ } from "solid-start/server";
import { logout } from "~/db/session";
import { useUser } from "~/db/useUser";
import LoginModal from "./LoginModal";
import { Portal } from "solid-js/web";

export default function Navbar() {
    const location = useLocation();

    const active = (path: string) => (path == location.pathname ? "border-sky-600" : "border-transparent hover:border-sky-600");

    const user = useUser();
    const [, { Form }] = createServerAction$((form: FormData, { request }) => logout(request));

    const [isModalOpen, setModalOpen] = createSignal();

    onMount(() => {
        setModalOpen(false);
    });
    onCleanup(() => {
        setModalOpen(false);
    });

    return (
        <>
            <nav class=' flex h-14 w-full items-center border-b border-transparent bg-white dark:border-darker-400/70 dark:bg-baltic-sea-850 dark:text-white'>
                <ul class='flex h-12 w-full'>
                    <li class={`border-b-2 ${active("/")} mx-1.5 my-auto sm:mx-6`}>
                        <A href='/'>Home</A>
                    </li>
                    <li class={`border-b-2 ${active("/about")} mx-1.5 my-auto sm:mx-6`}>
                        <A href='/about'>About</A>
                    </li>
                    <li class='my-auto ml-auto flex h-10 w-[700px] items-center rounded-3xl border border-darker-50/60 bg-[#F6F7F8] hover:border-blue-700/80 dark:border-darker-400/50 dark:bg-baltic-sea-800 dark:hover:border-white'>
                        <svg
                            xmlns='http://www.w3.org/2000/svg'
                            width='24'
                            height='24'
                            viewBox='0 0 24 24'
                            fill='none'
                            stroke-width='2'
                            stroke-linecap='round'
                            stroke-linejoin='round'
                            class='feather feather-search ml-3 mr-1 stroke-darker-400 dark:stroke-darker-300'
                        >
                            <circle cx='11' cy='11' r='8' />
                            <line x1='21' y1='21' x2='16.65' y2='16.65' />
                        </svg>
                        <input
                            type='search'
                            id='header-search-bar'
                            placeholder='Search edgeofnowhere'
                            class='h-5 w-[93%] bg-[#F6F7F8] text-sm focus-visible:outline-none dark:bg-baltic-sea-800 dark:text-darker-50'
                        />
                    </li>
                    <div class='ml-auto'>
                        <Show when={user()}>
                            <li class='my-auto flex'>
                                <h1 class='text-sm font-bold'>Hello {user()?.username}</h1>
                                <Form>
                                    <button name='logout' type='submit' class='ml-1 border align-top text-sm font-bold'>
                                        Logout
                                    </button>
                                </Form>
                            </li>
                        </Show>
                        <Show when={!user()} fallback={<li></li>}>
                            <li class='my-auto flex'>
                                <Show when={!isModalOpen()}>
                                    <button onClick={() => setModalOpen(!isModalOpen())}>Login or Signup</button>
                                </Show>
                            </li>
                        </Show>
                    </div>
                    <li class='my-auto'>
                        <svg
                            xmlns='http://www.w3.org/2000/svg'
                            width='24'
                            height='24'
                            viewBox='0 0 24 24'
                            fill='none'
                            stroke='currentColor'
                            stroke-width='2'
                            stroke-linecap='round'
                            stroke-linejoin='round'
                            class='feather feather-chevron-down inline-block'
                        >
                            <polyline points='6 9 12 15 18 9' />
                        </svg>
                    </li>
                </ul>
            </nav>
            <Show when={isModalOpen()}>
                <Portal>
                    <LoginModal toggle={() => setModalOpen(false)} />
                </Portal>
            </Show>
        </>
    );
}
