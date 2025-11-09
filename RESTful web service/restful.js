const fs = require('fs');
const http = require('http');
const {URL} = require('url');

//helper functions
function loadInitializeList (file, cb){ 
  fs.readFile(file, 'utf-8', (err, data)=>{
    if(err){
      cb([]); 
    }else{
      cb(JSON.parse(data || '[]')); 
    }
  });
}

//store into list
function storeList (file, list){

  fs.writeFile(file, JSON.stringify(list), (err)=>{
    if(err){
      console.log('Error: file cannot be written');
    }else{
      console.log("the file has been successfully written");
    }
  });
}//end function

//setting up the folder structure
const todoFolder = './todo'; 
const shopFolder = './shop';

fs.readdir(todoFolder, (err, content)=>{ //read folder
  if(err){
    fs.mkdir(todoFolder, (err)=>{
      if(err)throw err;
    });
  }
})

fs.readdir(shopFolder, (err, content)=>{
  if(err){
    fs.mkdir(shopFolder, (err)=>{ 
      if(err)throw err;
    });
  }
})

//file variables -> set up file paths
let todoFile = './todo/todo.json';
let shopFile = './shop/shop.json';

//handlers
//add query recevied to the list
const PUTHandler = (file, index, newItem, cb)=>{
  loadInitializeList(file, (list)=>{ //list only defined within this callback. Must use loadInitializer helper to laod list from memory
    if(index >= list.length){
      cb(404, 'NOT FOUND');
    }else{
      for(key in newItem){ //"key" is a placeholder for all the keys in the newItem
        list[index][key] = newItem[key];//returns whole object/all keys --> [key] returns specific key

      }
      //store updated list in file
      storeList(file, list);
      cb(200, 'OK\n');
    }
  });
}


const DELETEHandler = (file, index, cb)=>{ //needs file to be deleted, index (location), callback response
  loadInitializeList(file, (list)=>{ //list must be loaded into memory to delete anything
    if(index >= list.length){ //not found
      cb(404, 'NOT FOUND');
    }else{
      list.splice(index, 1) //splice deletes an item from (placeholder, #ofItems)
      storeList(file, list); //store updated list in the file
      cb(200, 'OK\n');
    }
  });
}

const POSTHandler = (file, newItem, cb)=>{ //add to file, newItem query) is added to list, cb responds after
  loadInitializeList(file, (list)=>{
    list.push(newItem);
    storeList(file,list); //store it in the list
    cb(200, 'OK\n'); //callback returns status code and OK
  });
}

const reqHandler = (req, res)=>{
  const baseURL = `http://${req.headers.host}/`;

  //extract pathname
  const{pathname, searchParams} = new URL(req.url, baseURL);
  let endpoints = pathname.split('/');
  let path = endpoints[1];
  let index = parseInt(endpoints[2],10); //change number to a stringify

//convert query string into Object
  let entries = searchParams.entries(); 
  let query = Object.fromEntries(entries);
  
  let method = req.method.toUpperCase(); //extract req method and convert to upper case

  switch(method){
    case 'POST': if(path === 'todo'){
      POSTHandler(todoFile, query, (statusCode, statusMessage)=>{
        res.setHeader('Content-Type', 'Text/Plain;charset="utf-8"');
        res.writeHead(statusCode);
        res.end(statusMessage);
      });
    }else if(path ==='shop'){
      POSTHandler(shopFile, query, (statusCode, statusMessage)=>{
        res.setHeader('Content-Type', 'Text/Plain;charset="utf-8"');
        res.writeHead(statusCode);
        res.end(statusMessage);
      }); 
    }else{
      res.writeHead(400);
      res.end('BAD REQUEST');
    }
    break;

    case 'GET':if(path === 'todo'){//to do
      res.setHeader('Content-Type', 'application/json'); //send as application
      res.statusCode200;
      const stream = fs.createReadStream(todoFile);
      stream.pipe(res);
      stream.on('error', (err)=>{ //listener for errors
        if(err.code === 'ENOENT'){ //file not found
          res.statusCode = 404;
          res.end('NOT FOUND');
        }else{ //other errors
          res.statusCode = 500; 
          res.end('Internal Server Error');
        }
      });  //end listener
    }else if(path ==='shop'){ //shop
      res.setHeader('Content-Type', 'application/json'); //send as application
      res.statusCode200;
      const stream = fs.createReadStream(shopFile);
      stream.pipe(res);  
      stream.on('error', (err)=>{ 
        if(err.code === 'ENOENT'){ 
          res.end('NOT FOUND');
        }else{ 
          res.statusCode = 500; 
          res.end('Internal Server Error');
        }
      }); //end listener
    }else{ //invalid path
      res.setHeader('Content-Type', 'Text/Plain;charset="utf-8"');
      res.writeHead(400);
      res.end('BAD REQUEST');
    }
    break;

    case 'PUT': if(path === 'todo'){
      PUTHandler(todoFile, index, query, (statusCode, statusMessage)=>{ //query is the newItem
        res.setHeader('Content-Type', 'text/plain;charset="utf-8"');
        res.writeHead(statusCode);
        res.end(statusMessage);
      });
    }else if(path ==='shop'){
      PUTHandler(shopFile, index, query, (statusCode, statusMessage)=>{ //query is the newItem
        res.setHeader('Content-Type', 'text/plain;charset="utf-8"');
        res.writeHead(statusCode);
        res.end(statusMessage);
      }); 
    }else{
      res.setHeader('Content-Type', 'Text/Plain;charset="utf-8"');
      res.writeHead(400);
      res.end('BAD REQUEST');
    }
    break;
    case 'DELETE': if(path === 'todo'){
      DELETEHandler(todoFile, index, (statusCode, statusMessage)=>{ //(cb returns (status code and message)
        res.setHeader('Content-Type', 'text/plain;charset="utf-8"');
        res.writeHead(statusCode); //writeHead cannot be changed, res.statusCode can be
        res.end(statusMessage);
      });
    }else if(path ==='shop'){
      DELETEHandler(shopFile, index, (statusCode, statusMessage)=>{ 
        res.setHeader('Content-Type', 'text/plain;charset="utf-8"');
        res.writeHead(statusCode);
        res.end(statusMessage);
      });
    }else{
      res.setHeader('Content-Type', 'Text/Plain;charset="utf-8"');
      res.writeHead(400);
      res.end('BAD REQUEST');
    }
    break;
    default: 
      res.setHeader('Content-Type', 'Text/Plain;charset="utf-8"');
      res.writeHead(400);
      res.end('BAD REQUEST');
  } //end switch
} //end request handler

//create server
const server = http.createServer(reqHandler);

server.listen(3032, ()=>{
  console.log(`The server is listening on port 3032`);
});