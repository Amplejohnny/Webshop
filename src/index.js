import http from "http";
import app from "./app.js";

//third party
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const { API_PORT } = process.env;

const options = {
  definition: {
      openapi: '3.0.0',
      info: {
          title: 'Webshop Application',
          version: '1.0.0',
          description: 'A Simple Webshop API'
      },
      components: {
          securitySchemes: {
              bearerAuth: {
                  type: 'http',
                  scheme: 'bearer',
                  bearerFormat: 'JWT'
              },
          },
      },
      security: [
          {
              bearerAuth: []
          },
      ],
      servers: [
          {
              url: `http://localhost:${API_PORT}`
          }
      ]
  },
  failOnErrors: true,
  apis: ["./src/routes/*.js", "./src/app.js"], 
}

const swaggerSpec = swaggerJSDoc(options);


app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

const server = http.createServer(app);
server.listen(API_PORT, () => {
  console.log(`Server running on port ${API_PORT}`);
});
