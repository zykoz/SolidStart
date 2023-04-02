import { createEffect, createSignal, onCleanup, Show } from "solid-js";
import { A, useParams } from "solid-start";
import { FormError } from "solid-start/data";
import { createServerAction$ } from "solid-start/server";
import { db } from "~/db";
import { createUserSession, login, register } from "~/db/session";

const slogans = [
    "Taking you to the Edge!",
    "Riding the Edge of Innovation!",
    "Pushing the Edge of Possibility!",
    "Living on the Edge of Excellence!",
    "Diving into the Cutting Edge!",
    "Always One Step Ahead!",
    "Leading the Way to the Future!",
];

function getRandomSlogan() {
    const randomIndex = Math.floor(Math.random() * slogans.length);
    return slogans[randomIndex];
}

function validateUsername(username: unknown) {
    if (typeof username !== "string" || username.length < 3) {
        return `Usernames must be at least 3 characters long`;
    }
}

function validatePassword(password: unknown) {
    if (typeof password !== "string" || password.length < 6) {
        return `Passwords must be at least 6 characters long`;
    }
}

export default function LoginModal(props: any) {
    const [tryLogin, setTryLogin] = createSignal(false);
    const [whenloggingIn, whenSetLoggingIn] = createSignal(false);

    function handleLogin() {
        whenSetLoggingIn(true);
    }
    const params = useParams();

    const [loggingIn, { Form }] = createServerAction$(async (form: FormData) => {
        const loginType = form.get("loginType");
        const username = form.get("username");
        const password = form.get("password");
        const redirectTo = form.get("redirectTo") || "/";
        if (typeof loginType !== "string" || typeof username !== "string" || typeof password !== "string" || typeof redirectTo !== "string") {
            throw new FormError(`Form not submitted correctly.`);
        }

        const fields = { loginType, username, password };
        const fieldErrors = {
            username: validateUsername(username),
            password: validatePassword(password),
        };
        if (Object.values(fieldErrors).some(Boolean)) {
            throw new FormError("Fields invalid", { fieldErrors, fields });
        }

        switch (loginType) {
            case "login": {
                const user = await login({ username, password });
                if (!user) {
                    throw new FormError(`Username/Password combination is incorrect`, {
                        fields,
                    });
                }
                return createUserSession(`${user.id}`, redirectTo);
            }
            case "register": {
                const userExists = await db.user.findUnique({ where: { username } });
                if (userExists) {
                    throw new FormError(`User with username ${username} already exists`, {
                        fields,
                    });
                }
                const user = await register({ username, password });
                if (!user) {
                    throw new FormError(`Something went wrong trying to create a new user.`, {
                        fields,
                    });
                }
                return createUserSession(`${user.id}`, redirectTo);
            }
            default: {
                throw new FormError(`Login type invalid`, { fields });
            }
        }
    });

    createEffect(() => {
        if (whenloggingIn()) {
            const interval = setInterval(() => {
                if (!loggingIn.pending) {
                    clearInterval(interval);
                    props.toggle();
                    whenSetLoggingIn(false);
                }
            }, 100);
        }
    });

    let requiredFields: any[];
    let overlay: any, submitBtn: any;
    let userInput: any, passInput: any;

    let oneShot = true;
    
    function updateLoginBtn() {
        for (let i = 0; i < requiredFields.length; i++) {
            if (!requiredFields[i].value) {
                submitBtn.disabled = true;
                return;
            }
        }
        submitBtn.disabled = false;
    }

    let cleanupFormSetup: () => any;

    function handleFormSetup() {
        if (oneShot) {
            requiredFields = [userInput, passInput];
            requiredFields.forEach((field) => {
                field.addEventListener("input", updateLoginBtn);
            });
            cleanupFormSetup = () => {
                requiredFields.forEach((field) => {
                    field.removeEventListener("input", updateLoginBtn);
                });
            };
            oneShot = false;
        } else {
            return;
        }
    }

    onCleanup(() => {
        cleanupFormSetup();
    });

    function checkValidity(event: any) {
        const input = event.target;
        const isValid = input.validity.valid;
        if (!isValid) {
            overlay.classList.remove("bg-green-600/50");
            overlay.classList.remove("bg-black/50");
            overlay.classList.add("bg-red-700/30");
        } else {
            overlay.classList.remove("bg-red-700/30");
            overlay.classList.add("bg-green-600/50");
        }
    }

    return (
        <>
            <Form class='absolute top-[50%] left-[50%] z-20 flex h-[512px] w-[340px] max-w-lg translate-x-[-50%] translate-y-[-50%] flex-col items-center gap-8 border border-darker-300/60 bg-white shadow hover:border-darker-400/70 dark:border-transparent dark:bg-baltic-sea-850 hover:dark:border-darker-400/70'>
                <div class='col-span-3 w-full bg-[#DAE0E6]/50 dark:bg-black'>
                    <button
                        onClick={() => {
                            props.toggle();
                            setTryLogin(false);
                        }}
                        class='ml-auto block h-8 w-8'
                        type='button'
                    >
                        <svg
                            xmlns='http://www.w3.org/2000/svg'
                            viewBox='0 0 32 32'
                            fill='none'
                            stroke='currentColor'
                            stroke-width='1'
                            stroke-linecap='round'
                            stroke-linejoin='round'
                            class='feather feather-x'
                        >
                            <line x1='10' y1='10' x2='22' y2='22' />
                            <line x1='22' y1='10' x2='10' y2='22' />
                        </svg>
                    </button>
                </div>
                <input type='hidden' name='redirectTo' value={params.redirectTo ?? "/"} />
                <fieldset class='select-none self-start'>
                    <div
                        onClick={() => {
                            setTryLogin(true);
                            handleFormSetup();
                        }}
                    >
                        <input id='loginOption' type='radio' name='loginType' value='login' checked={true} class='invisible bg-darker-500' />
                        <label for='loginOption'>Login</label>
                        <input id='registerOption' type='radio' name='loginType' value='register' class='invisible bg-darker-500' />
                        <label for='registerOption'>Register</label>
                    </div>
                </fieldset>
                <Show when={tryLogin() === false}>
                    <div class='mt-8 h-16 justify-self-end'>
                        <svg
                            xmlns='http://www.w3.org/2000/svg'
                            width='64'
                            height='64'
                            viewBox='0 0 24 24'
                            fill='none'
                            stroke='currentColor'
                            stroke-width='2'
                            stroke-linecap='round'
                            stroke-linejoin='round'
                            class='feather feather-user'
                        >
                            <path d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2' />
                            <circle cx='12' cy='7' r='4' />
                        </svg>
                        <svg
                            style={`transform: translate(33px, -24px );`}
                            xmlns='http://www.w3.org/2000/svg'
                            fill='gold'
                            version='1.1'
                            id='Capa_1'
                            width='24px'
                            height='24px'
                            viewBox='0 0 30.334 30.334'
                        >
                            <g>
                                <path d='M15.167,0C6.805,0,0.001,6.804,0.001,15.167c0,8.362,6.804,15.167,15.166,15.167c8.361,0,15.166-6.805,15.166-15.167   C30.333,6.804,23.528,0,15.167,0z M17.167,25.667h-4v-4.5h4V25.667z M17.167,19.542h-4V5.167h4V19.542z' />
                            </g>
                        </svg>
                    </div>
                </Show>
                <h6 class='text-[.8em]'>Login to view more</h6>
                {tryLogin() && (
                    <>
                        <div>
                            <label class='sr-only block' for='username-input'>
                                Username
                            </label>
                            <input
                                ref={userInput}
                                class='mt-1 block w-full rounded-sm border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 shadow-sm invalid:border-pink-500
      invalid:text-pink-600 focus:border-sky-500 focus:outline-none focus:ring-1
      focus:ring-sky-500 focus:invalid:border-pink-500 focus:invalid:ring-pink-500 disabled:border-slate-200
      disabled:bg-slate-50 disabled:text-slate-500
      disabled:shadow-none dark:bg-darker-500 dark:text-white'
                                name='username'
                                placeholder='Email or account name'
                                minlength='3'
                                required
                                oninput={checkValidity}
                            />
                        </div>
                        <Show when={loggingIn.error?.fieldErrors?.username}>
                            <p role='alert' class='border-l-4 border-orange-500 bg-orange-100 p-4 text-orange-700'>
                                {loggingIn.error.fieldErrors.username}
                            </p>
                        </Show>
                        <div>
                            <label class='sr-only block' for='password-input'>
                                Password
                            </label>
                            <input
                                ref={passInput}
                                class='mt-1 block w-full rounded-sm border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 shadow-sm focus:border-sky-500
      focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:border-slate-200
      disabled:bg-slate-50 disabled:text-slate-500 disabled:shadow-none dark:bg-darker-500 dark:text-white'
                                name='password'
                                type='password'
                                placeholder='Password'
                                minlength='6'
                                required
                                oninput={checkValidity}
                            />
                        </div>
                    </>
                )}
                <Show when={loggingIn.error?.fieldErrors?.password}>
                    <p role='alert'>{loggingIn.error.fieldErrors.password}</p>
                </Show>
                <Show when={loggingIn.error}>
                    <p role='alert' id='error-message'>
                        {loggingIn.error.message}
                    </p>
                </Show>
                <Show when={tryLogin() === false}>
                    <button
                        onClick={() => {
                            setTryLogin(true);
                            handleFormSetup();
                        }}
                        class='sm:[1.2em] mb-8 rounded-md bg-[gold] px-11 py-[6px] font-medium text-black hover:bg-yellow-300'
                    >
                        Log In
                    </button>
                </Show>

                <Show when={tryLogin() === true}>
                    <button
                        onClick={handleLogin}
                        ref={submitBtn}
                        id='login-btn'
                        class='sm:[1.2em] rounded bg-[gold] px-12 py-[6px] font-medium text-black hover:bg-yellow-500'
                        disabled={loggingIn.pending}
                        type='submit'
                    >
                        Log In
                    </button>
                    <Show when={loggingIn.pending}>
                        <div class='animate-pulse border-t border-b border-blue-500 bg-blue-100 px-4 py-3 text-blue-700' role='alert'>
                            {getRandomSlogan()}
                        </div>
                    </Show>

                    <div class='mb-8 mt-8 flex w-full flex-col justify-center justify-self-start indent-3'>
                        <A href='#' class='block h-8 text-sm font-semibold text-[gold]/90'>
                            Forgot password?
                        </A>
                        <A href='#' class='block h-8 text-sm font-semibold text-[gold]/90'>
                            Create an Edge Account
                        </A>
                    </div>
                </Show>
            </Form>
            <button
                ref={overlay}
                class='absolute inset-0 z-10 bg-black/50 transition-colors'
                onClick={() => {
                    props.toggle();
                    setTryLogin(false);
                }}
            />
        </>
    );
}
