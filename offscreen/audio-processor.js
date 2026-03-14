class JumeauCaptureProcessor extends AudioWorkletProcessor {
    process(inputs, outputs) {
        const input = inputs[0];
        const output = outputs[0];

        if (output && output[0]) {
            output[0].fill(0);
        }

        if (!input || !input[0] || input[0].length === 0) {
            return true;
        }

        const channelData = new Float32Array(input[0]);
        this.port.postMessage(channelData);
        return true;
    }
}

registerProcessor('jumeau-capture-processor', JumeauCaptureProcessor);
