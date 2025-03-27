const formatTextWithLinks = (text: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  return text.replace(
    urlRegex,
    '<a href="$1" target="_blank" class="text-blue-600 hover:underline">$1</a>',
  )
}

export default formatTextWithLinks
