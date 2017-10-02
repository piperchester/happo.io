import constructReport from './constructReport';
import createDynamicEntryPoint from './createDynamicEntryPoint';
import createWebpackBundle from './createWebpackBundle';
import loadCSSFile from './loadCSSFile';
import processSnapsInBundle from './processSnapsInBundle';

export default async function reactDOMRunner({
  apiKey,
  apiSecret,
  setupScript,
  customizeWebpackConfig,
  stylesheets,
  include,
  endpoint,
  targets,
}) {
  console.log('Generating entry point...');
  const entryFile = await createDynamicEntryPoint({ setupScript, include });

  console.log('Producing bundle...');
  const bundleFile = await createWebpackBundle(entryFile, {
    customizeWebpackConfig,
  });

  const cssBlocks = await Promise.all(stylesheets.map(loadCSSFile));

  console.log('Executing bundle...');
  const { globalCSS, snapPayloads } = await processSnapsInBundle(bundleFile, {
    globalCSS: cssBlocks.join('').replace(/\n/g, ''),
  });

  console.log('Generating screenshots...');
  const results = await Promise.all(Object.keys(targets).map(async (name) => {
    const result = await targets[name].execute({
      globalCSS,
      snapPayloads,
      apiKey,
      apiSecret,
      endpoint,
    });
    return { name, result };
  }));

  return await constructReport(results);
}
