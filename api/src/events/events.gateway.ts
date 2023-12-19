import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
  } from '@nestjs/websockets';
  import { Logger } from '@nestjs/common';
  import { Server, Socket } from 'socket.io';
  import { decode } from 'jsonwebtoken';
    import { UserService } from 'src/user/user.service';
  
  @WebSocketGateway({
    cors: {
      origin: '*',
    },
  })
  export class EventsGateway
    implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
  {
    constructor(
      private userService: UserService,
    ) {}
    @WebSocketServer() server: Server;
    private logger: Logger = new Logger('AppGateway');

    private connectedUsers = [];
  
    async handleConnection(client: Socket) {
        console.log('Client connected');
      const { token } = client.handshake.headers;
      console.log(token);
      
      if (!token) {
        return;
      }
      
      if (typeof token === 'string') {
        const decoded: any = decode(token);
        const { username } = decoded;
        console.log(username);
        const user = await this.userService.findOneByUsername(username);
        console.log(user);
        // await this.connectedUsersService.create({ socketId: client.id, user });
        this.connectedUsers.push({
          user,
          socketId: client.id,
        });
        console.log(this.connectedUsers);
        this.server.emit('users', this.connectedUsers);
      }
    }
  
    async handleDisconnect(client: Socket) {
        console.log('Client disconnected');
      const user = this.connectedUsers.find(
        (connectedUser) => connectedUser.socketId === client.id,
      );
      if (user) {
        // await this.connectedUsersService.delete(user.id);
        this.connectedUsers = this.connectedUsers.filter(
          (connectedUser) => connectedUser.socketId !== client.id,
        );
        this.server.emit('users', this.connectedUsers);
      }
      
    }
  
    afterInit(server: Server) {
      this.logger.log('Websocket server initialized');
    }
  }
  