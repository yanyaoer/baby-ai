import html from "./index.html"
import { Ai } from './vendor/@cloudflare/ai.js';


export default {
  async fetch(request, env) {
    if (request.headers.get('Accept').includes('html')) {
      return new Response(html, { headers: { 'Content-Type': 'text/html' } });
    }

    const url = new URL(request.url);

    const prompt = (await request.clone().text()) || url.searchParams.get("prompt");

    const ai = new Ai(env.AI);
    /*
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
    */

    if (url.pathname === '/text-generation/') {
      // https://developers.cloudflare.com/workers-ai/models/text-generation/
      const messages = [
        { role: 'system', content: 'You are a friendly assistant' },
        { role: 'user', content: prompt }
      ];
      const model = url.searchParams.get("model") || '@cf/mistral/mistral-7b-instruct-v0.1';
      const response = await ai.run(model, { messages });
      // const response = await ai.run('@cf/mistral/mistral-7b-instruct-v0.1', { messages, stream: true });

      return Response.json(response);

      /*
      return new Response(response, {
        headers: {
          "content-type": "text/event-stream",
        },
      });
      */

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
