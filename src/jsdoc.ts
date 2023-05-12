import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Job test",
      version: "1.0.0",
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [] as string[],
      },
    ],
  },
  apis: ["./**/*.ts"], // files containing annotations as above
};
const openapiSpecification = swaggerJsdoc(options);
export default openapiSpecification;
