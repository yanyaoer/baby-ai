import html from "./index.html"
import { Ai } from './vendor/@cloudflare/ai.js';


export default {
  async fetch(request, env, ctx) {
    if (request.headers.get('Accept').includes('html')) {
      return new Response(html, { headers: { 'Content-Type': 'text/html' } });
    }

    const url = new URL(request.url);

    const prompt = (await request.text()) || url.searchParams.get("prompt");

    const ai = new Ai(env.AI, { sessionOptions: { ctx: ctx } });
    /*
    asr
      @cf/openai/whisper
    text-generation
      @cf/meta/llama-2-7b-chat-fp16
      @cf/meta/llama-2-7b-chat-int8
      @cf/mistral/mistral-7b-instruct-v0.1
      @hf/thebloke/codellama-7b-instruct-awq
    text-translation
      @cf/meta/m2m100-1.2b
    text-to-image
      @cf/stabilityai/stable-diffusion-xl-base-1.0
    image-classification
      @cf/microsoft/resnet-50
    text-classification
      @cf/huggingface/distilbert-sst-2-int8
    text-embedding
      @cf/baai/bge-small-en-v1.5
      @cf/baai/bge-base-en-v1.5
      @cf/baai/bge-large-en-v1.5
    */

    if (url.pathname === '/text-generation/') {
      // https://developers.cloudflare.com/workers-ai/models/text-generation/
      const messages = [
        { role: 'system', content: 'You are a friendly assistant' },
        { role: 'user', content: prompt }
      ];
      const model = url.searchParams.get("model") || '@cf/mistral/mistral-7b-instruct-v0.1';
      console.log(url.searchParams.get('stream'), url.pathname, request.url)
      if (url.searchParams.get("stream") === '1') {
        const response = await ai.run(model, { messages, stream: true });
        console.log(response);
        return new Response(response, {
          headers: { "content-type": "text/event-stream" },
        });
      } else {
        const response = await ai.run(model, { messages });
        return Response.json(response);
      }
    } else if (url.pathname === '/text-translation/') {

      const response = await ai.run('@cf/meta/m2m100-1.2b', {
        text: prompt || 'Tell me a joke about Cloudflare',
        source_lang: url.searchParams.get("in") || 'en',
        target_lang: url.searchParams.get("out") || 'zh'
      });

      return Response.json(response);
    }

    const response = await ai.run("@cf/stabilityai/stable-diffusion-xl-base-1.0", {
      prompt: prompt,
    });

    return new Response(response, {
        headers: {
            "content-type": "image/png",
        },
    });
  }
}
