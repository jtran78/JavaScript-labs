const fs = require('fs');
const http = require('http');

//Create an HTTP server object
const server = http.createServer();

//Register a listener for the request event
server.on('request', (req, res)=>{

//construct filename from the request URL
    let filename = req.url.replace('/','');

    //Attach a ReadableStream to the file
    const rStream = fs.createReadStream(filename);

    //Direct the output of the ReadableStream to the res object
    rStream.pipe(res);

    //Define a listener for the error event and handle the error
    rStream.on('error', (err)=> {
        res.end('Error reading the file\n');
    });
}); //end server.on


//Server listens on port 8080
server.listen(8080, ()=>{
    console.log('Server listening on port 8080');
});


