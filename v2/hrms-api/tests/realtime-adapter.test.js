import test from 'node:test';
import assert from 'node:assert/strict';
import { createRealtimeAdapter } from '../src/integrations/realtime.js';

const fakeIo=()=>{
  const middleware=[],listeners=[],emissions=[];
  return {middleware,listeners,emissions,use(fn){middleware.push(fn);},on(name,fn){listeners.push([name,fn]);},to(room){return {emit:(event,payload)=>emissions.push({room,event,payload})};}};
};

test('realtime adapter is disabled by default and emits nothing',()=>{
  const io=fakeIo(),adapter=createRealtimeAdapter({io,authenticate:async()=>({userId:'u1',organizationId:'o1'})});
  assert.equal(adapter.enabled,false);
  assert.deepEqual(io.middleware,[]);
  adapter.emitAttendanceUpdate({organizationId:'o1',userId:'u1'},{present:true});
  adapter.emitNotification({organizationId:'o1',userId:'u1'},{_id:'n1'});
  adapter.emitMonitorSettingsUpdate({organizationId:'o1'},{settings:{}});
  assert.deepEqual(io.emissions,[]);
});

test('enabled realtime adapter authenticates token, joins scoped rooms and emits v1 event names',async()=>{
  const io=fakeIo(),adapter=createRealtimeAdapter({io,enabled:true,authenticate:async token=>{assert.equal(token,'signed');return {userId:'u1',organizationId:'o1',email:'u@example.com'};},verifyToken:()=>({})});
  assert.equal(adapter.enabled,true);
  const middleware=io.middleware[0];
  const socket={handshake:{auth:{token:'Bearer signed'},headers:{}},data:{},rooms:[],join(room){this.rooms.push(room);},once(){},disconnect(){}};
  await new Promise((resolve,reject)=>middleware(socket,error=>error?reject(error):resolve()));
  assert.deepEqual(socket.data.identity,{userId:'u1',organizationId:'o1',email:'u@example.com',expiresAt:null});
  io.listeners.find(([name])=>name==='connection')[1](socket);
  assert.deepEqual(socket.rooms,['attendance:o1:u1','monitor-settings:o1']);
  adapter.emitAttendanceUpdate({organizationId:'o1',userId:'u1'},{checkInAt:'now'});
  adapter.emitNotification({organizationId:'o1',userId:'u1'},{_id:'n1'});
  adapter.emitMonitorSettingsUpdate({organizationId:'o1'},{enabled:true});
  assert.deepEqual(io.emissions.map(item=>item.event),['attendance:updated','notification:new','monitor-settings:updated']);
});

test('realtime adapter rejects missing and invalid sessions before connection',async()=>{
  const io=fakeIo(),adapter=createRealtimeAdapter({io,enabled:true,authenticate:async token=>{if(token!=='ok')throw new Error('Session expired');return {userId:'u1',organizationId:'o1'};}});
  const middleware=io.middleware[0];
  const invoke=handshake=>new Promise(resolve=>middleware({handshake,data:{}},error=>resolve(error)));
  assert.match((await invoke({auth:{},headers:{}})).message,/Authorization token missing/);
  assert.match((await invoke({auth:{token:'bad'},headers:{}})).message,/Session expired/);
});
