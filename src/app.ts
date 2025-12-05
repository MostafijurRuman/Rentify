import express, { Request, Response } from 'express'
const app = express();
// parser
app.use(express.json())


// Root Route
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "This is the root route",
    path: req.path,
  });
});






// 404 Routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.path,
  });
});

app.listen(5000,()=>{
    console.log("this app is runnding on port 5000")
})

export default  app;