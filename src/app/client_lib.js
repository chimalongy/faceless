export function get_channel_type(channelId, path) {
  // 1. Guard clause to prevent crashes
  if (!path || !channelId) return "v2"; 

  // 2. Use a template literal to ensure the ID is followed immediately by the version
  // Adding a leading slash (if applicable) makes it even more precise
  const searchPattern = `${channelId}/v1`;

  if (path.includes(searchPattern)) {
    return "v1";
  }

  return "v2";
}