export default function PrimaryButton({
    className = '',
    disabled,
    children,
    ...props
}) {
    return (
        <button
            {...props}
            className={
                `inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-cyan-600 via-teal-500 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-200 ease-in-out hover:from-cyan-500 hover:via-teal-400 hover:to-blue-500 hover:shadow-xl hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${
                    disabled && 'opacity-50 cursor-not-allowed'
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
