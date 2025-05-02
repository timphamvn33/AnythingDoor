# Use official Node.js image
FROM node:16

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to install dependencies
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the backend code to the container
COPY . .

# Build the NestJS application
RUN npm run build

# Expose the port the app will run on
EXPOSE 3000

# Run the NestJS application
CMD ["npm", "run", "start:prod"]
