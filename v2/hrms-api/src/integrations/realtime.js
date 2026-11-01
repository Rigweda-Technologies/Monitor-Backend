const tokenFrom = socket => {
  const value=socket.handshake?.auth?.token||socket.handshake?.headers?.authorization||'';
  if(typeof value!=='string'||!value.trim())return null;
  return value.startsWith('Bearer ')?value.slice(7).trim():value.trim();
};
const userRoom=(organizationId,userId)=>`attendance:${organizationId}:${userId}`;
const settingsRoom=organizationId=>`monitor-settings:${organizationId}`;
const noop=()=>{};

// The caller owns the Socket.IO server, CORS/path configuration, and shutdown.
// This bridge is opt-in so v2 startup cannot create a second event publisher.
export const createRealtimeAdapter=({io,authenticate,verifyToken,enabled=false,now=()=>Date.now()}={})=>{
  if(!enabled)return {enabled:false,emitAttendanceUpdate:noop,emitNotification:noop,emitMonitorSettingsUpdate:noop};
  if(!io?.use||!io?.on||typeof authenticate!=='function')throw new TypeError('Enabled realtime needs a Socket.IO server and session authenticator');
  io.use(async(socket,next)=>{
    try{
      const token=tokenFrom(socket);
      if(!token)throw new Error('Authorization token missing');
      const identity=await authenticate(token);
      if(!identity?.userId||!identity?.organizationId)throw new Error('Authenticated user has no organization context');
      let expiresAt=null;
      if(verifyToken){const claims=verifyToken(token);expiresAt=claims?.exp?Number(claims.exp)*1000:null;}
      socket.data.identity={userId:String(identity.userId),organizationId:String(identity.organizationId),email:identity.email||null,expiresAt};
      return next();
    }catch(error){return next(new Error(error?.message||'Unauthorized'));}
  });
  io.on('connection',socket=>{
    const identity=socket.data?.identity;
    if(identity?.organizationId&&identity?.userId)socket.join(userRoom(identity.organizationId,identity.userId));
    if(identity?.organizationId)socket.join(settingsRoom(identity.organizationId));
    if(identity?.expiresAt){
      const expiry=Math.max(0,identity.expiresAt-now());
      const timer=setTimeout(()=>socket.disconnect(true),Math.min(expiry,2_147_483_647));
      timer.unref?.();
      socket.once('disconnect',()=>clearTimeout(timer));
    }
  });
  return {
    enabled:true,
    emitAttendanceUpdate(identity,payload){if(identity?.organizationId&&identity?.userId)io.to(userRoom(String(identity.organizationId),String(identity.userId))).emit('attendance:updated',payload);},
    emitNotification(identity,payload){if(identity?.organizationId&&identity?.userId&&payload)io.to(userRoom(String(identity.organizationId),String(identity.userId))).emit('notification:new',payload);},
    emitMonitorSettingsUpdate(identity,payload){if(identity?.organizationId&&payload)io.to(settingsRoom(String(identity.organizationId))).emit('monitor-settings:updated',payload);},
  };
};
