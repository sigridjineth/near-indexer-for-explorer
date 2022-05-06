import { startStream, types } from 'near-lake-framework';

const lakeConfig: types.LakeConfig = {
    s3BucketName: "near-lake-data-mainnet",
    s3RegionName: "eu-central-1",
    startBlockHeight: 63804051,
};

async function handleStreamerMessage(streamerMessage: types.StreamerMessage): Promise<void> {
    console.log(`Block #${streamerMessage.block.header.height} Shards: ${streamerMessage.shards.length}`);
}

(async () => {
    await startStream(lakeConfig, handleStreamerMessage);
})();
