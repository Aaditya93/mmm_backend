import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
const ffmpegBinaryPath = ffmpegStatic;
ffmpeg.setFfmpegPath(ffmpegBinaryPath);
export function convertToMp3(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .audioCodec("libmp3lame")
            .audioBitrate(128)
            .audioChannels(2)
            .audioFrequency(44100)
            .format("mp3")
            .on("end", () => resolve())
            .on("error", reject)
            .save(outputPath);
    });
}
export function convertToWav(rawData, mimeType) {
    const options = parseMimeType(mimeType);
    const wavHeader = createWavHeader(rawData.length, options);
    const buffer = Buffer.from(rawData, "base64");
    return Buffer.concat([wavHeader, buffer]);
}
function parseMimeType(mimeType) {
    const [fileType, ...params] = mimeType.split(";").map((s) => s.trim());
    const [_, format] = fileType.split("/");
    const options = {
        numChannels: 1,
        sampleRate: 22050,
        bitsPerSample: 16,
    };
    if (format && format.startsWith("L")) {
        const bits = parseInt(format.slice(1), 10);
        if (!isNaN(bits)) {
            options.bitsPerSample = bits;
        }
    }
    for (const param of params) {
        const [key, value] = param.split("=").map((s) => s.trim());
        if (key === "rate") {
            options.sampleRate = parseInt(value, 10);
        }
    }
    return options;
}
function createWavHeader(dataLength, options) {
    const { numChannels, sampleRate, bitsPerSample } = options;
    const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
    const blockAlign = (numChannels * bitsPerSample) / 8;
    const buffer = Buffer.alloc(44);
    buffer.write("RIFF", 0);
    buffer.writeUInt32LE(36 + dataLength, 4);
    buffer.write("WAVE", 8);
    buffer.write("fmt ", 12);
    buffer.writeUInt32LE(16, 16);
    buffer.writeUInt16LE(1, 20);
    buffer.writeUInt16LE(numChannels, 22);
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(byteRate, 28);
    buffer.writeUInt16LE(blockAlign, 32);
    buffer.writeUInt16LE(bitsPerSample, 34);
    buffer.write("data", 36);
    buffer.writeUInt32LE(dataLength, 40);
    return buffer;
}
