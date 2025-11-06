import { forwardRef } from 'react';

export default forwardRef(function Select(
    { className = '', children, ...props },
    ref,
) {
    return (
        <select
            {...props}
            ref={ref}
            className={
                'block w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-gray-900 placeholder:text-gray-400 transition-all duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none hover:border-gray-300 ' +
                className
            }
        >
            {children}
        </select>
    );
});

