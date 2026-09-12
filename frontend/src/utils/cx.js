export default function cx(...parts) {
  return parts.flat(Infinity).filter(Boolean).join(' ');
}