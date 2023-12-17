export const onRequest: PagesFunction<object> = (context) => {
  return new Response("Hello, world!");
};
