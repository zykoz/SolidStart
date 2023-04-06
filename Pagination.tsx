import { For, Show, createEffect, createSignal } from "solid-js";
import { A, useLocation } from "solid-start";

const [tryTest, setTryTest] = createSignal(1);

export default function Pagination(props: any) {
    const location = useLocation();
    createEffect(() => {
        console.log("pagination pagination range updated");
        tryTest();
    });
    return (
        <div class='pagination-container bg-white dark:bg-baltic-sea-850 dark:text-white'>
            <Show
                when={props.store().currentPage !== 1}
                fallback={
                    <button class={`pagination-item`}>
                        <div class='arrow left opacity-50'>
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
                                class='feather feather-arrow-left'
                            >
                                <line x1='19' y1='12' x2='5' y2='12' />
                                <polyline points='12 19 5 12 12 5' />
                            </svg>
                        </div>
                    </button>
                }
            >
                <A
                    href={`?page=${Number(location.query["page"]) - 1}`}
                    class={`pagination-item`}
                    onClick={() => {
                        props.onPageChange(props.store().currentPage - 1);
                        setTryTest(tryTest() + 2);
                    }}
                >
                    <div class='arrow left dark:text-white'>
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
                            class='feather feather-arrow-left'
                        >
                            <line x1='19' y1='12' x2='5' y2='12' />
                            <polyline points='12 19 5 12 12 5' />
                        </svg>
                    </div>
                </A>
            </Show>
            <For each={props.store().range}>
                {(pageNumber) => {
                    if ((pageNumber as unknown as string) === props.store().DOTS) {
                        return <button class='pagination-item dots'>&#8230;</button>;
                    }
                    return (
                        <A
                            href={`?page=${pageNumber}`}
                            class={`pagination-item ${pageNumber === props.store().currentPage && "selected"}`}
                            onClick={() => {
                                props.onPageChange(pageNumber);
                            }}
                        >
                            {pageNumber}
                        </A>
                    );
                }}
            </For>
            <Show
                when={props.store().currentPage !== props.store().lastPage}
                fallback={
                    <button class={`pagination-item`}>
                        <div class='arrow right opacity-50  dark:text-white'>
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
                                class='feather feather-arrow-right'
                            >
                                <line x1='5' y1='12' x2='19' y2='12' />
                                <polyline points='12 5 19 12 12 19' />
                            </svg>
                        </div>
                    </button>
                }
            >
                <A
                    href={`?page=${Number(location.query["page"]) + 1}`}
                    class={`pagination-item`}
                    onClick={() => {
                        props.onPageChange(Number(props.store().currentPage) + 1);
                        setTryTest(tryTest() + 2);
                    }}
                >
                    <div class='arrow right dark:text-white'>
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
                            class='feather feather-arrow-right'
                        >
                            <line x1='5' y1='12' x2='19' y2='12' />
                            <polyline points='12 5 19 12 12 19' />
                        </svg>
                    </div>
                </A>
            </Show>
        </div>
    );
}
