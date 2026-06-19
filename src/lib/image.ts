import * as ImageManipulator from 'expo-image-manipulator';

const MAX_DIM = 512; // 最长边：穿搭场景 512 足够看清整体

/**
 * 把任意尺寸图片压到最长边 640、JPEG 0.5，返回 base64。
 * 视觉任务对分辨率要求不高，640 已经够看清整套搭配。
 */
export async function compressForAI(uri: string): Promise<{
  uri: string;
  base64: string;
  mediaType: 'image/jpeg';
  width: number;
  height: number;
}> {
  const out = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: MAX_DIM } }], // 高度按比例自动
    { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG, base64: true },
  );
  if (!out.base64) throw new Error('图片压缩失败');
  return {
    uri: out.uri,
    base64: out.base64,
    mediaType: 'image/jpeg',
    width: out.width,
    height: out.height,
  };
}
