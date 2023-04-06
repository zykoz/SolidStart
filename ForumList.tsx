import Forum from "./Forum";
import { For, createEffect } from "solid-js";
import { gridColumn } from "~/store/mySignal";
import { useRouteData, useLocation } from "solid-start";
import Pagination from "./Pagination";
import type { Topic } from "@prisma/client";
import { createMutable } from "solid-js/store";

export default function ForumList(props: any) {
    const data = useRouteData<typeof props.dataType>();

    let paginationStore = createMutable({
        currentPage: Number(useLocation().query["page"]) || 1,
        totalCount: data.latest?.totalForums,
        siblingCount: 1,
        pageSize: data.latest?.itemsPerPage,
    });

    createEffect(() => {
        console.log("ForumList PaginationStore in effect");
        paginationStore = createMutable({
            currentPage: Number(useLocation().query["page"]) || 1,
            totalCount: data.latest?.totalForums,
            siblingCount: 1,
            pageSize: data.latest?.itemsPerPage,
        });
    });
    return (
        <section class={`grid grid-cols-${gridColumn().toString()}`}>
            {Array.isArray(data.latest?.forums) ? (
                <For
                    each={data.latest?.forums}
                    fallback={
                        <div class='grid max-h-max min-h-[56px] w-full grid-cols-12 items-center justify-items-center border border-darker-100 bg-white text-sm dark:border-darker-400/70 dark:bg-baltic-sea-850 dark:hover:border-baltic-sea-100/70 sm:text-base'>
                            <div class='col-span-1'>
                                <svg
                                    width='24'
                                    height='24'
                                    xmlns='http://www.w3.org/2000/svg'
                                    viewBox='0 0 24 24'
                                    class='-scale-100 fill-darker-300  hover:fill-cyan-400'
                                >
                                    <path d='M16,13V21H8V13H2L12,3L22,13H16M7,11H10V19H14V11H17L12,6L7,11Z' />
                                </svg>
                                <svg width='24' height='24' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' class='fill-darker-300  hover:fill-cyan-400'>
                                    <path d='M16,13V21H8V13H2L12,3L22,13H16M7,11H10V19H14V11H17L12,6L7,11Z' />
                                </svg>
                            </div>
                            <div class='col-span-4 flex h-full w-full items-center justify-self-start dark:text-slate-100'>This would be you Title.</div>
                            <ul class='col-span-3'>
                                <li class='text-darker-300 dark:text-slate-100'>Last Topic</li>
                                <li class='text-darker-300'>Name of Author</li>
                            </ul>
                            <span class='col-span-1 text-darker-300'>10</span>
                            <ul class='col-span-3'>
                                <li class='text-darker-300 dark:text-slate-100'>Last Reply</li>
                                <li class='text-darker-300'>22 minutes ago</li>
                            </ul>
                        </div>
                    }
                >
                    {(forum) => (
                        <Forum
                            href={`/f/${encodeURIComponent(forum.name.replace(/\s+/g, "_"))}`}
                            title={forum?.name}
                            author={forum?.createdBy}
                            lastTopic={forum?.topics[forum?.topics.length - 1] || ({} as Topic)}
                        />
                    )}
                </For>
            ) : (
                <Forum href={`/f/${encodeURIComponent(!data.latest?.forums[0]?.name.replace(/\s+/g, "_"))}`} title={!data?.latest?.forums[0]?.name} />
            )}
            <Pagination store={paginationStore} onPageChange={(page: number) => (paginationStore.currentPage = page)} />
        </section>
    );
}
