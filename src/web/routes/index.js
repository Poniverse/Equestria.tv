import { sendJade } from '../jade';
import * as channels from '../../database/channels';

export default function initialize(app, channelIndex) {
    app.get('/', (req, res) => {
        channels.topX(20, function(err, rows){
            sendJade(res, "index", {
                channels: rows ? rows : []
            });
        });
    });
}
