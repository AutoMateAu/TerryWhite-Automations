import { Fal } from '@fal-ai/sdk'

const fal = new Fal({ apiKey: 'your-api-key' })

async function testRun() {
  const result = await fal.invoke('fal-ai/stable-diffusion-xl', {
    prompt: 'a scenic view of mountains at dawn'
  })
  console.log(result)
}

export default testRun
