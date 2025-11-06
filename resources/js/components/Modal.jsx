import {
    Dialog,
    DialogPanel,
    Transition,
    TransitionChild,
} from '@headlessui/react';

export default function Modal({
    children,
    show = false,
    maxWidth = '2xl',
    closeable = true,
    onClose = () => {},
}) {
    const close = () => {
        if (closeable) {
            onClose();
        }
    };

    const maxWidthClass = {
        sm: 'sm:max-w-sm',
        md: 'sm:max-w-md',
        lg: 'sm:max-w-lg',
        xl: 'sm:max-w-xl',
        '2xl': 'sm:max-w-2xl',
        '3xl': 'sm:max-w-3xl',
        '4xl': 'sm:max-w-4xl',
        '5xl': 'sm:max-w-5xl',
        '6xl': 'sm:max-w-6xl',
        '7xl': 'sm:max-w-7xl',
    }[maxWidth] || 'sm:max-w-2xl';

    return (
        <Transition show={show} appear>
            <Dialog
                as="div"
                className="fixed inset-0 z-[9999] overflow-y-auto"
                onClose={close}
            >
                <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
                    <TransitionChild
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div 
                            className="fixed inset-0 bg-gradient-to-br from-gray-900/60 via-gray-800/60 to-gray-900/60 backdrop-blur-md transition-opacity" 
                            aria-hidden="true"
                            onClick={closeable ? close : undefined}
                        />
                    </TransitionChild>

                    <TransitionChild
                        enter="ease-out duration-300"
                        enterFrom="opacity-0 translate-y-8 sm:translate-y-0 sm:scale-95"
                        enterTo="opacity-100 translate-y-0 sm:scale-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                        leaveTo="opacity-0 translate-y-8 sm:translate-y-0 sm:scale-95"
                    >
                        <DialogPanel
                            className={`relative w-full transform overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 transition-all sm:mx-auto ${maxWidthClass} max-h-[90vh] flex flex-col`}
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-gray-50/50" />
                            <div className="relative z-10">
                                {children}
                            </div>
                        </DialogPanel>
                    </TransitionChild>
                </div>
            </Dialog>
        </Transition>
    );
}
