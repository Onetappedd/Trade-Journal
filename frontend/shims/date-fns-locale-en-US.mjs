/**
 * Shim to expose BOTH default and named `enUS` exports.
 * We import from the deep path to avoid alias recursion.
 */
import enUS from 'date-fns/locale/en-US';

export { enUS };
export default enUS;
