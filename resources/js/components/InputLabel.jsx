export default function InputLabel({
    value,
    className = '',
    children,
    ...props
}) {
    return (
        <label
            {...props}
            className={
                `block text-sm font-semibold text-gray-700 mb-1 ` +
                className
            }
        >
            {value ? value : children}
        </label>
    );
}
