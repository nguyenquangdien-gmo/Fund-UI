import axios from 'axios'

const run_url = 'https://chat.runsystem.vn/api/v4'
const post = async (message: string) => {
  try {
    const response = await axios.post(
      `${run_url}/posts`,
      { message, channel_id: 'mo66frnazir7uqq397h6wjhnrw' },
      {
        headers: { Authorization: `Bearer gnuook57mfg7mgw61oxmece6ty` },
      },
    )
    console.log('post success')
  } catch (error) {
    console.error('Error fetching users:', error)
  }
}
export default post
