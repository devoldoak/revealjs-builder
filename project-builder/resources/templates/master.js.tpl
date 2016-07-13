Reveal.initialize({
    // other options...

    multiplex: {
        // Example values. To generate your own, see the socket.io server instructions.
        secret: '<%= socketIOToken.secret %>', // Obtained from the socket.io server. Gives this (the master) control of the presentation
        id: '<%= socketIOToken.socketId %>', // id, obtained from socket.io server
        url: 'http://<%= dockerHost %>:<%= dockerHostPortSocketIO %>' // Location of socket.io server
    },

    // Don't forget to add the dependencies
    dependencies: [
        { src: 'plugin/socket.io/socket.io.js', async: true },
        { src: 'plugin/multiplex/master.js', async: true },

        // other dependencies...
        { src: 'plugin/markdown/marked.js' },
        { src: 'plugin/markdown/markdown.js' },
        { src: 'plugin/notes/notes.js', async: true },
        { src: 'plugin/highlight/highlight.js', async: true, callback: function() { hljs.initHighlightingOnLoad(); } }
    ]
});