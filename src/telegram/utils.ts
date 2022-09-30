export function formatDuration(duration: number) {
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration - hours * 3600) / 60);
  const seconds = duration - hours * 3600 - minutes * 60;

  const values = [];
  values.push(hours < 10 ? `0${hours}` : hours);
  values.push(`0${minutes}`.substr(-2));
  values.push(`0${seconds}`.substr(-2));
  return values.join(':');
}
