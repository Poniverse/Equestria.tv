CUSTOM_EMBED_WARNING = 'This channel is embedding custom content from %link%.
    Since this content is not trusted, you must click "Embed" below to allow
    the content to be embedded.<hr>'

window.CustomEmbedPlayer = class CustomEmbedPlayer extends EmbedPlayer
    constructor: (data) ->
        if not (this instanceof CustomEmbedPlayer)
            return new CustomEmbedPlayer(data)

        @load(data)

    load: (data) ->
        if not data.meta.embed?
            console.error('CustomEmbedPlayer::load(): missing meta.embed')
            return

        super(data);
