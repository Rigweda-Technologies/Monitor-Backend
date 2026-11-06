
/**
 * Client
**/

import * as runtime from './runtime/client.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model MonitorActivityEvent
 * 
 */
export type MonitorActivityEvent = $Result.DefaultSelection<Prisma.$MonitorActivityEventPayload>
/**
 * Model MonitorDevicePresence
 * 
 */
export type MonitorDevicePresence = $Result.DefaultSelection<Prisma.$MonitorDevicePresencePayload>
/**
 * Model MonitorBrowserHistory
 * 
 */
export type MonitorBrowserHistory = $Result.DefaultSelection<Prisma.$MonitorBrowserHistoryPayload>
/**
 * Model MonitorAppUsageSession
 * 
 */
export type MonitorAppUsageSession = $Result.DefaultSelection<Prisma.$MonitorAppUsageSessionPayload>
/**
 * Model MonitorCloudinarySetting
 * 
 */
export type MonitorCloudinarySetting = $Result.DefaultSelection<Prisma.$MonitorCloudinarySettingPayload>
/**
 * Model MonitorDeviceHealth
 * 
 */
export type MonitorDeviceHealth = $Result.DefaultSelection<Prisma.$MonitorDeviceHealthPayload>
/**
 * Model MonitorScreenshotBatch
 * 
 */
export type MonitorScreenshotBatch = $Result.DefaultSelection<Prisma.$MonitorScreenshotBatchPayload>
/**
 * Model MonitorScreenshot
 * 
 */
export type MonitorScreenshot = $Result.DefaultSelection<Prisma.$MonitorScreenshotPayload>

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient({
 *   adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
 * })
 * // Fetch zero or more MonitorActivityEvents
 * const monitorActivityEvents = await prisma.monitorActivityEvent.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://pris.ly/d/client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient({
   *   adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
   * })
   * // Fetch zero or more MonitorActivityEvents
   * const monitorActivityEvents = await prisma.monitorActivityEvent.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://pris.ly/d/client).
   */

  constructor(optionsArg ?: Prisma.PrismaClientConstructorArgs<ClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/orm/prisma-client/queries/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>

  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.monitorActivityEvent`: Exposes CRUD operations for the **MonitorActivityEvent** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more MonitorActivityEvents
    * const monitorActivityEvents = await prisma.monitorActivityEvent.findMany()
    * ```
    */
  get monitorActivityEvent(): Prisma.MonitorActivityEventDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.monitorDevicePresence`: Exposes CRUD operations for the **MonitorDevicePresence** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more MonitorDevicePresences
    * const monitorDevicePresences = await prisma.monitorDevicePresence.findMany()
    * ```
    */
  get monitorDevicePresence(): Prisma.MonitorDevicePresenceDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.monitorBrowserHistory`: Exposes CRUD operations for the **MonitorBrowserHistory** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more MonitorBrowserHistories
    * const monitorBrowserHistories = await prisma.monitorBrowserHistory.findMany()
    * ```
    */
  get monitorBrowserHistory(): Prisma.MonitorBrowserHistoryDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.monitorAppUsageSession`: Exposes CRUD operations for the **MonitorAppUsageSession** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more MonitorAppUsageSessions
    * const monitorAppUsageSessions = await prisma.monitorAppUsageSession.findMany()
    * ```
    */
  get monitorAppUsageSession(): Prisma.MonitorAppUsageSessionDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.monitorCloudinarySetting`: Exposes CRUD operations for the **MonitorCloudinarySetting** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more MonitorCloudinarySettings
    * const monitorCloudinarySettings = await prisma.monitorCloudinarySetting.findMany()
    * ```
    */
  get monitorCloudinarySetting(): Prisma.MonitorCloudinarySettingDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.monitorDeviceHealth`: Exposes CRUD operations for the **MonitorDeviceHealth** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more MonitorDeviceHealths
    * const monitorDeviceHealths = await prisma.monitorDeviceHealth.findMany()
    * ```
    */
  get monitorDeviceHealth(): Prisma.MonitorDeviceHealthDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.monitorScreenshotBatch`: Exposes CRUD operations for the **MonitorScreenshotBatch** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more MonitorScreenshotBatches
    * const monitorScreenshotBatches = await prisma.monitorScreenshotBatch.findMany()
    * ```
    */
  get monitorScreenshotBatch(): Prisma.MonitorScreenshotBatchDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.monitorScreenshot`: Exposes CRUD operations for the **MonitorScreenshot** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more MonitorScreenshots
    * const monitorScreenshots = await prisma.monitorScreenshot.findMany()
    * ```
    */
  get monitorScreenshot(): Prisma.MonitorScreenshotDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 7.10.1
   * Query Engine version: d1b3f377ca835d73fd50954a5e22128b9ebdd6b8
   */
  export type PrismaVersion = {
    client: string
    engine: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import Bytes = runtime.Bytes
  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * Resolved type of the argument passed to the `PrismaClient` constructor.
   *
   * When called without a narrower options type (the common case), this resolves
   * to `PrismaClientOptions` directly, which produces a clear TypeScript error
   * message (`not assignable to parameter of type 'PrismaClientOptions'`) when
   * the argument is missing or incomplete. When the user supplies a narrower
   * options type (e.g. via a literal), it falls back to `Subset` to keep
   * filtering out unknown properties.
   */
  export type PrismaClientConstructorArgs<Options extends PrismaClientOptions> =
    [PrismaClientOptions] extends [Options] ? PrismaClientOptions : Subset<Options, PrismaClientOptions>;

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      ((Without<T, U> & U) | (Without<U, T> & T)) & object
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    MonitorActivityEvent: 'MonitorActivityEvent',
    MonitorDevicePresence: 'MonitorDevicePresence',
    MonitorBrowserHistory: 'MonitorBrowserHistory',
    MonitorAppUsageSession: 'MonitorAppUsageSession',
    MonitorCloudinarySetting: 'MonitorCloudinarySetting',
    MonitorDeviceHealth: 'MonitorDeviceHealth',
    MonitorScreenshotBatch: 'MonitorScreenshotBatch',
    MonitorScreenshot: 'MonitorScreenshot'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]



  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "monitorActivityEvent" | "monitorDevicePresence" | "monitorBrowserHistory" | "monitorAppUsageSession" | "monitorCloudinarySetting" | "monitorDeviceHealth" | "monitorScreenshotBatch" | "monitorScreenshot"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      MonitorActivityEvent: {
        payload: Prisma.$MonitorActivityEventPayload<ExtArgs>
        fields: Prisma.MonitorActivityEventFieldRefs
        operations: {
          findUnique: {
            args: Prisma.MonitorActivityEventFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorActivityEventPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.MonitorActivityEventFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorActivityEventPayload>
          }
          findFirst: {
            args: Prisma.MonitorActivityEventFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorActivityEventPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.MonitorActivityEventFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorActivityEventPayload>
          }
          findMany: {
            args: Prisma.MonitorActivityEventFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorActivityEventPayload>[]
          }
          create: {
            args: Prisma.MonitorActivityEventCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorActivityEventPayload>
          }
          createMany: {
            args: Prisma.MonitorActivityEventCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.MonitorActivityEventCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorActivityEventPayload>[]
          }
          delete: {
            args: Prisma.MonitorActivityEventDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorActivityEventPayload>
          }
          update: {
            args: Prisma.MonitorActivityEventUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorActivityEventPayload>
          }
          deleteMany: {
            args: Prisma.MonitorActivityEventDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.MonitorActivityEventUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.MonitorActivityEventUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorActivityEventPayload>[]
          }
          upsert: {
            args: Prisma.MonitorActivityEventUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorActivityEventPayload>
          }
          aggregate: {
            args: Prisma.MonitorActivityEventAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateMonitorActivityEvent>
          }
          groupBy: {
            args: Prisma.MonitorActivityEventGroupByArgs<ExtArgs>
            result: $Utils.Optional<MonitorActivityEventGroupByOutputType>[]
          }
          count: {
            args: Prisma.MonitorActivityEventCountArgs<ExtArgs>
            result: $Utils.Optional<MonitorActivityEventCountAggregateOutputType> | number
          }
        }
      }
      MonitorDevicePresence: {
        payload: Prisma.$MonitorDevicePresencePayload<ExtArgs>
        fields: Prisma.MonitorDevicePresenceFieldRefs
        operations: {
          findUnique: {
            args: Prisma.MonitorDevicePresenceFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorDevicePresencePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.MonitorDevicePresenceFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorDevicePresencePayload>
          }
          findFirst: {
            args: Prisma.MonitorDevicePresenceFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorDevicePresencePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.MonitorDevicePresenceFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorDevicePresencePayload>
          }
          findMany: {
            args: Prisma.MonitorDevicePresenceFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorDevicePresencePayload>[]
          }
          create: {
            args: Prisma.MonitorDevicePresenceCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorDevicePresencePayload>
          }
          createMany: {
            args: Prisma.MonitorDevicePresenceCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.MonitorDevicePresenceCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorDevicePresencePayload>[]
          }
          delete: {
            args: Prisma.MonitorDevicePresenceDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorDevicePresencePayload>
          }
          update: {
            args: Prisma.MonitorDevicePresenceUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorDevicePresencePayload>
          }
          deleteMany: {
            args: Prisma.MonitorDevicePresenceDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.MonitorDevicePresenceUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.MonitorDevicePresenceUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorDevicePresencePayload>[]
          }
          upsert: {
            args: Prisma.MonitorDevicePresenceUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorDevicePresencePayload>
          }
          aggregate: {
            args: Prisma.MonitorDevicePresenceAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateMonitorDevicePresence>
          }
          groupBy: {
            args: Prisma.MonitorDevicePresenceGroupByArgs<ExtArgs>
            result: $Utils.Optional<MonitorDevicePresenceGroupByOutputType>[]
          }
          count: {
            args: Prisma.MonitorDevicePresenceCountArgs<ExtArgs>
            result: $Utils.Optional<MonitorDevicePresenceCountAggregateOutputType> | number
          }
        }
      }
      MonitorBrowserHistory: {
        payload: Prisma.$MonitorBrowserHistoryPayload<ExtArgs>
        fields: Prisma.MonitorBrowserHistoryFieldRefs
        operations: {
          findUnique: {
            args: Prisma.MonitorBrowserHistoryFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorBrowserHistoryPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.MonitorBrowserHistoryFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorBrowserHistoryPayload>
          }
          findFirst: {
            args: Prisma.MonitorBrowserHistoryFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorBrowserHistoryPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.MonitorBrowserHistoryFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorBrowserHistoryPayload>
          }
          findMany: {
            args: Prisma.MonitorBrowserHistoryFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorBrowserHistoryPayload>[]
          }
          create: {
            args: Prisma.MonitorBrowserHistoryCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorBrowserHistoryPayload>
          }
          createMany: {
            args: Prisma.MonitorBrowserHistoryCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.MonitorBrowserHistoryCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorBrowserHistoryPayload>[]
          }
          delete: {
            args: Prisma.MonitorBrowserHistoryDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorBrowserHistoryPayload>
          }
          update: {
            args: Prisma.MonitorBrowserHistoryUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorBrowserHistoryPayload>
          }
          deleteMany: {
            args: Prisma.MonitorBrowserHistoryDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.MonitorBrowserHistoryUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.MonitorBrowserHistoryUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorBrowserHistoryPayload>[]
          }
          upsert: {
            args: Prisma.MonitorBrowserHistoryUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorBrowserHistoryPayload>
          }
          aggregate: {
            args: Prisma.MonitorBrowserHistoryAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateMonitorBrowserHistory>
          }
          groupBy: {
            args: Prisma.MonitorBrowserHistoryGroupByArgs<ExtArgs>
            result: $Utils.Optional<MonitorBrowserHistoryGroupByOutputType>[]
          }
          count: {
            args: Prisma.MonitorBrowserHistoryCountArgs<ExtArgs>
            result: $Utils.Optional<MonitorBrowserHistoryCountAggregateOutputType> | number
          }
        }
      }
      MonitorAppUsageSession: {
        payload: Prisma.$MonitorAppUsageSessionPayload<ExtArgs>
        fields: Prisma.MonitorAppUsageSessionFieldRefs
        operations: {
          findUnique: {
            args: Prisma.MonitorAppUsageSessionFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorAppUsageSessionPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.MonitorAppUsageSessionFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorAppUsageSessionPayload>
          }
          findFirst: {
            args: Prisma.MonitorAppUsageSessionFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorAppUsageSessionPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.MonitorAppUsageSessionFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorAppUsageSessionPayload>
          }
          findMany: {
            args: Prisma.MonitorAppUsageSessionFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorAppUsageSessionPayload>[]
          }
          create: {
            args: Prisma.MonitorAppUsageSessionCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorAppUsageSessionPayload>
          }
          createMany: {
            args: Prisma.MonitorAppUsageSessionCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.MonitorAppUsageSessionCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorAppUsageSessionPayload>[]
          }
          delete: {
            args: Prisma.MonitorAppUsageSessionDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorAppUsageSessionPayload>
          }
          update: {
            args: Prisma.MonitorAppUsageSessionUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorAppUsageSessionPayload>
          }
          deleteMany: {
            args: Prisma.MonitorAppUsageSessionDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.MonitorAppUsageSessionUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.MonitorAppUsageSessionUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorAppUsageSessionPayload>[]
          }
          upsert: {
            args: Prisma.MonitorAppUsageSessionUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorAppUsageSessionPayload>
          }
          aggregate: {
            args: Prisma.MonitorAppUsageSessionAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateMonitorAppUsageSession>
          }
          groupBy: {
            args: Prisma.MonitorAppUsageSessionGroupByArgs<ExtArgs>
            result: $Utils.Optional<MonitorAppUsageSessionGroupByOutputType>[]
          }
          count: {
            args: Prisma.MonitorAppUsageSessionCountArgs<ExtArgs>
            result: $Utils.Optional<MonitorAppUsageSessionCountAggregateOutputType> | number
          }
        }
      }
      MonitorCloudinarySetting: {
        payload: Prisma.$MonitorCloudinarySettingPayload<ExtArgs>
        fields: Prisma.MonitorCloudinarySettingFieldRefs
        operations: {
          findUnique: {
            args: Prisma.MonitorCloudinarySettingFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorCloudinarySettingPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.MonitorCloudinarySettingFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorCloudinarySettingPayload>
          }
          findFirst: {
            args: Prisma.MonitorCloudinarySettingFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorCloudinarySettingPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.MonitorCloudinarySettingFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorCloudinarySettingPayload>
          }
          findMany: {
            args: Prisma.MonitorCloudinarySettingFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorCloudinarySettingPayload>[]
          }
          create: {
            args: Prisma.MonitorCloudinarySettingCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorCloudinarySettingPayload>
          }
          createMany: {
            args: Prisma.MonitorCloudinarySettingCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.MonitorCloudinarySettingCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorCloudinarySettingPayload>[]
          }
          delete: {
            args: Prisma.MonitorCloudinarySettingDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorCloudinarySettingPayload>
          }
          update: {
            args: Prisma.MonitorCloudinarySettingUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorCloudinarySettingPayload>
          }
          deleteMany: {
            args: Prisma.MonitorCloudinarySettingDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.MonitorCloudinarySettingUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.MonitorCloudinarySettingUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorCloudinarySettingPayload>[]
          }
          upsert: {
            args: Prisma.MonitorCloudinarySettingUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorCloudinarySettingPayload>
          }
          aggregate: {
            args: Prisma.MonitorCloudinarySettingAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateMonitorCloudinarySetting>
          }
          groupBy: {
            args: Prisma.MonitorCloudinarySettingGroupByArgs<ExtArgs>
            result: $Utils.Optional<MonitorCloudinarySettingGroupByOutputType>[]
          }
          count: {
            args: Prisma.MonitorCloudinarySettingCountArgs<ExtArgs>
            result: $Utils.Optional<MonitorCloudinarySettingCountAggregateOutputType> | number
          }
        }
      }
      MonitorDeviceHealth: {
        payload: Prisma.$MonitorDeviceHealthPayload<ExtArgs>
        fields: Prisma.MonitorDeviceHealthFieldRefs
        operations: {
          findUnique: {
            args: Prisma.MonitorDeviceHealthFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorDeviceHealthPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.MonitorDeviceHealthFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorDeviceHealthPayload>
          }
          findFirst: {
            args: Prisma.MonitorDeviceHealthFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorDeviceHealthPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.MonitorDeviceHealthFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorDeviceHealthPayload>
          }
          findMany: {
            args: Prisma.MonitorDeviceHealthFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorDeviceHealthPayload>[]
          }
          create: {
            args: Prisma.MonitorDeviceHealthCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorDeviceHealthPayload>
          }
          createMany: {
            args: Prisma.MonitorDeviceHealthCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.MonitorDeviceHealthCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorDeviceHealthPayload>[]
          }
          delete: {
            args: Prisma.MonitorDeviceHealthDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorDeviceHealthPayload>
          }
          update: {
            args: Prisma.MonitorDeviceHealthUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorDeviceHealthPayload>
          }
          deleteMany: {
            args: Prisma.MonitorDeviceHealthDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.MonitorDeviceHealthUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.MonitorDeviceHealthUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorDeviceHealthPayload>[]
          }
          upsert: {
            args: Prisma.MonitorDeviceHealthUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorDeviceHealthPayload>
          }
          aggregate: {
            args: Prisma.MonitorDeviceHealthAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateMonitorDeviceHealth>
          }
          groupBy: {
            args: Prisma.MonitorDeviceHealthGroupByArgs<ExtArgs>
            result: $Utils.Optional<MonitorDeviceHealthGroupByOutputType>[]
          }
          count: {
            args: Prisma.MonitorDeviceHealthCountArgs<ExtArgs>
            result: $Utils.Optional<MonitorDeviceHealthCountAggregateOutputType> | number
          }
        }
      }
      MonitorScreenshotBatch: {
        payload: Prisma.$MonitorScreenshotBatchPayload<ExtArgs>
        fields: Prisma.MonitorScreenshotBatchFieldRefs
        operations: {
          findUnique: {
            args: Prisma.MonitorScreenshotBatchFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorScreenshotBatchPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.MonitorScreenshotBatchFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorScreenshotBatchPayload>
          }
          findFirst: {
            args: Prisma.MonitorScreenshotBatchFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorScreenshotBatchPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.MonitorScreenshotBatchFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorScreenshotBatchPayload>
          }
          findMany: {
            args: Prisma.MonitorScreenshotBatchFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorScreenshotBatchPayload>[]
          }
          create: {
            args: Prisma.MonitorScreenshotBatchCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorScreenshotBatchPayload>
          }
          createMany: {
            args: Prisma.MonitorScreenshotBatchCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.MonitorScreenshotBatchCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorScreenshotBatchPayload>[]
          }
          delete: {
            args: Prisma.MonitorScreenshotBatchDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorScreenshotBatchPayload>
          }
          update: {
            args: Prisma.MonitorScreenshotBatchUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorScreenshotBatchPayload>
          }
          deleteMany: {
            args: Prisma.MonitorScreenshotBatchDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.MonitorScreenshotBatchUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.MonitorScreenshotBatchUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorScreenshotBatchPayload>[]
          }
          upsert: {
            args: Prisma.MonitorScreenshotBatchUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorScreenshotBatchPayload>
          }
          aggregate: {
            args: Prisma.MonitorScreenshotBatchAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateMonitorScreenshotBatch>
          }
          groupBy: {
            args: Prisma.MonitorScreenshotBatchGroupByArgs<ExtArgs>
            result: $Utils.Optional<MonitorScreenshotBatchGroupByOutputType>[]
          }
          count: {
            args: Prisma.MonitorScreenshotBatchCountArgs<ExtArgs>
            result: $Utils.Optional<MonitorScreenshotBatchCountAggregateOutputType> | number
          }
        }
      }
      MonitorScreenshot: {
        payload: Prisma.$MonitorScreenshotPayload<ExtArgs>
        fields: Prisma.MonitorScreenshotFieldRefs
        operations: {
          findUnique: {
            args: Prisma.MonitorScreenshotFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorScreenshotPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.MonitorScreenshotFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorScreenshotPayload>
          }
          findFirst: {
            args: Prisma.MonitorScreenshotFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorScreenshotPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.MonitorScreenshotFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorScreenshotPayload>
          }
          findMany: {
            args: Prisma.MonitorScreenshotFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorScreenshotPayload>[]
          }
          create: {
            args: Prisma.MonitorScreenshotCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorScreenshotPayload>
          }
          createMany: {
            args: Prisma.MonitorScreenshotCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.MonitorScreenshotCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorScreenshotPayload>[]
          }
          delete: {
            args: Prisma.MonitorScreenshotDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorScreenshotPayload>
          }
          update: {
            args: Prisma.MonitorScreenshotUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorScreenshotPayload>
          }
          deleteMany: {
            args: Prisma.MonitorScreenshotDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.MonitorScreenshotUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.MonitorScreenshotUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorScreenshotPayload>[]
          }
          upsert: {
            args: Prisma.MonitorScreenshotUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MonitorScreenshotPayload>
          }
          aggregate: {
            args: Prisma.MonitorScreenshotAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateMonitorScreenshot>
          }
          groupBy: {
            args: Prisma.MonitorScreenshotGroupByArgs<ExtArgs>
            result: $Utils.Optional<MonitorScreenshotGroupByOutputType>[]
          }
          count: {
            args: Prisma.MonitorScreenshotCountArgs<ExtArgs>
            result: $Utils.Optional<MonitorScreenshotCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     * 
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * 
     * ```
     * Read more in our [docs](https://pris.ly/d/logging).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * A driver adapter that PrismaClient uses to connect to your database, such as the ones provided by `@prisma/adapter-pg`, `@prisma/adapter-libsql`, `@prisma/adapter-planetscale`, etc.
     * 
     * A driver adapter is **required** unless you connect to your database through Prisma Accelerate (in which case use `accelerateUrl` instead).
     * 
     * Learn more: https://pris.ly/d/driver-adapters
     * 
     * @example
     * ```ts
     * import { PrismaPg } from '@prisma/adapter-pg'
     * import { PrismaClient } from './generated/prisma/client'
     * 
     * const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
     * const prisma = new PrismaClient({ adapter })
     * ```
     */
    adapter?: runtime.SqlDriverAdapterFactory
    /**
     * The Prisma Accelerate connection URL. Use this option to connect to your database through Prisma Accelerate instead of using a driver adapter to connect directly.
     * 
     * Learn more: https://pris.ly/d/accelerate
     */
    accelerateUrl?: string
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
    /**
     * SQL commenter plugins that add metadata to SQL queries as comments.
     * Comments follow the sqlcommenter format: https://google.github.io/sqlcommenter/
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   adapter,
     *   comments: [
     *     traceContext(),
     *     queryInsights(),
     *   ],
     * })
     * ```
     */
    comments?: runtime.SqlCommenterPlugin[]
  }
  export type GlobalOmitConfig = {
    monitorActivityEvent?: MonitorActivityEventOmit
    monitorDevicePresence?: MonitorDevicePresenceOmit
    monitorBrowserHistory?: MonitorBrowserHistoryOmit
    monitorAppUsageSession?: MonitorAppUsageSessionOmit
    monitorCloudinarySetting?: MonitorCloudinarySettingOmit
    monitorDeviceHealth?: MonitorDeviceHealthOmit
    monitorScreenshotBatch?: MonitorScreenshotBatchOmit
    monitorScreenshot?: MonitorScreenshotOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type MonitorScreenshotBatchCountOutputType
   */

  export type MonitorScreenshotBatchCountOutputType = {
    screenshots: number
  }

  export type MonitorScreenshotBatchCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    screenshots?: boolean | MonitorScreenshotBatchCountOutputTypeCountScreenshotsArgs
  }

  // Custom InputTypes
  /**
   * MonitorScreenshotBatchCountOutputType without action
   */
  export type MonitorScreenshotBatchCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorScreenshotBatchCountOutputType
     */
    select?: MonitorScreenshotBatchCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * MonitorScreenshotBatchCountOutputType without action
   */
  export type MonitorScreenshotBatchCountOutputTypeCountScreenshotsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: MonitorScreenshotWhereInput
  }


  /**
   * Models
   */

  /**
   * Model MonitorActivityEvent
   */

  export type AggregateMonitorActivityEvent = {
    _count: MonitorActivityEventCountAggregateOutputType | null
    _avg: MonitorActivityEventAvgAggregateOutputType | null
    _sum: MonitorActivityEventSumAggregateOutputType | null
    _min: MonitorActivityEventMinAggregateOutputType | null
    _max: MonitorActivityEventMaxAggregateOutputType | null
  }

  export type MonitorActivityEventAvgAggregateOutputType = {
    activeSeconds: number | null
    idleSeconds: number | null
  }

  export type MonitorActivityEventSumAggregateOutputType = {
    activeSeconds: number | null
    idleSeconds: number | null
  }

  export type MonitorActivityEventMinAggregateOutputType = {
    id: string | null
    dailyKey: string | null
    organizationId: string | null
    employeeId: string | null
    employeeName: string | null
    employeeCode: string | null
    deviceId: string | null
    activityDate: Date | null
    observedAt: Date | null
    status: string | null
    activeSeconds: number | null
    idleSeconds: number | null
    createdAt: Date | null
  }

  export type MonitorActivityEventMaxAggregateOutputType = {
    id: string | null
    dailyKey: string | null
    organizationId: string | null
    employeeId: string | null
    employeeName: string | null
    employeeCode: string | null
    deviceId: string | null
    activityDate: Date | null
    observedAt: Date | null
    status: string | null
    activeSeconds: number | null
    idleSeconds: number | null
    createdAt: Date | null
  }

  export type MonitorActivityEventCountAggregateOutputType = {
    id: number
    dailyKey: number
    organizationId: number
    employeeId: number
    employeeName: number
    employeeCode: number
    deviceId: number
    activityDate: number
    observedAt: number
    status: number
    activeSeconds: number
    idleSeconds: number
    eventIds: number
    createdAt: number
    _all: number
  }


  export type MonitorActivityEventAvgAggregateInputType = {
    activeSeconds?: true
    idleSeconds?: true
  }

  export type MonitorActivityEventSumAggregateInputType = {
    activeSeconds?: true
    idleSeconds?: true
  }

  export type MonitorActivityEventMinAggregateInputType = {
    id?: true
    dailyKey?: true
    organizationId?: true
    employeeId?: true
    employeeName?: true
    employeeCode?: true
    deviceId?: true
    activityDate?: true
    observedAt?: true
    status?: true
    activeSeconds?: true
    idleSeconds?: true
    createdAt?: true
  }

  export type MonitorActivityEventMaxAggregateInputType = {
    id?: true
    dailyKey?: true
    organizationId?: true
    employeeId?: true
    employeeName?: true
    employeeCode?: true
    deviceId?: true
    activityDate?: true
    observedAt?: true
    status?: true
    activeSeconds?: true
    idleSeconds?: true
    createdAt?: true
  }

  export type MonitorActivityEventCountAggregateInputType = {
    id?: true
    dailyKey?: true
    organizationId?: true
    employeeId?: true
    employeeName?: true
    employeeCode?: true
    deviceId?: true
    activityDate?: true
    observedAt?: true
    status?: true
    activeSeconds?: true
    idleSeconds?: true
    eventIds?: true
    createdAt?: true
    _all?: true
  }

  export type MonitorActivityEventAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which MonitorActivityEvent to aggregate.
     */
    where?: MonitorActivityEventWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MonitorActivityEvents to fetch.
     */
    orderBy?: MonitorActivityEventOrderByWithRelationInput | MonitorActivityEventOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: MonitorActivityEventWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MonitorActivityEvents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MonitorActivityEvents.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned MonitorActivityEvents
    **/
    _count?: true | MonitorActivityEventCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: MonitorActivityEventAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: MonitorActivityEventSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: MonitorActivityEventMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: MonitorActivityEventMaxAggregateInputType
  }

  export type GetMonitorActivityEventAggregateType<T extends MonitorActivityEventAggregateArgs> = {
        [P in keyof T & keyof AggregateMonitorActivityEvent]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateMonitorActivityEvent[P]>
      : GetScalarType<T[P], AggregateMonitorActivityEvent[P]>
  }




  export type MonitorActivityEventGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: MonitorActivityEventWhereInput
    orderBy?: MonitorActivityEventOrderByWithAggregationInput | MonitorActivityEventOrderByWithAggregationInput[]
    by: MonitorActivityEventScalarFieldEnum[] | MonitorActivityEventScalarFieldEnum
    having?: MonitorActivityEventScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: MonitorActivityEventCountAggregateInputType | true
    _avg?: MonitorActivityEventAvgAggregateInputType
    _sum?: MonitorActivityEventSumAggregateInputType
    _min?: MonitorActivityEventMinAggregateInputType
    _max?: MonitorActivityEventMaxAggregateInputType
  }

  export type MonitorActivityEventGroupByOutputType = {
    id: string
    dailyKey: string | null
    organizationId: string | null
    employeeId: string
    employeeName: string | null
    employeeCode: string | null
    deviceId: string
    activityDate: Date | null
    observedAt: Date
    status: string
    activeSeconds: number
    idleSeconds: number
    eventIds: string[]
    createdAt: Date
    _count: MonitorActivityEventCountAggregateOutputType | null
    _avg: MonitorActivityEventAvgAggregateOutputType | null
    _sum: MonitorActivityEventSumAggregateOutputType | null
    _min: MonitorActivityEventMinAggregateOutputType | null
    _max: MonitorActivityEventMaxAggregateOutputType | null
  }

  type GetMonitorActivityEventGroupByPayload<T extends MonitorActivityEventGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<MonitorActivityEventGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof MonitorActivityEventGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], MonitorActivityEventGroupByOutputType[P]>
            : GetScalarType<T[P], MonitorActivityEventGroupByOutputType[P]>
        }
      >
    >


  export type MonitorActivityEventSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    dailyKey?: boolean
    organizationId?: boolean
    employeeId?: boolean
    employeeName?: boolean
    employeeCode?: boolean
    deviceId?: boolean
    activityDate?: boolean
    observedAt?: boolean
    status?: boolean
    activeSeconds?: boolean
    idleSeconds?: boolean
    eventIds?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["monitorActivityEvent"]>

  export type MonitorActivityEventSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    dailyKey?: boolean
    organizationId?: boolean
    employeeId?: boolean
    employeeName?: boolean
    employeeCode?: boolean
    deviceId?: boolean
    activityDate?: boolean
    observedAt?: boolean
    status?: boolean
    activeSeconds?: boolean
    idleSeconds?: boolean
    eventIds?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["monitorActivityEvent"]>

  export type MonitorActivityEventSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    dailyKey?: boolean
    organizationId?: boolean
    employeeId?: boolean
    employeeName?: boolean
    employeeCode?: boolean
    deviceId?: boolean
    activityDate?: boolean
    observedAt?: boolean
    status?: boolean
    activeSeconds?: boolean
    idleSeconds?: boolean
    eventIds?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["monitorActivityEvent"]>

  export type MonitorActivityEventSelectScalar = {
    id?: boolean
    dailyKey?: boolean
    organizationId?: boolean
    employeeId?: boolean
    employeeName?: boolean
    employeeCode?: boolean
    deviceId?: boolean
    activityDate?: boolean
    observedAt?: boolean
    status?: boolean
    activeSeconds?: boolean
    idleSeconds?: boolean
    eventIds?: boolean
    createdAt?: boolean
  }

  export type MonitorActivityEventOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "dailyKey" | "organizationId" | "employeeId" | "employeeName" | "employeeCode" | "deviceId" | "activityDate" | "observedAt" | "status" | "activeSeconds" | "idleSeconds" | "eventIds" | "createdAt", ExtArgs["result"]["monitorActivityEvent"]>

  export type $MonitorActivityEventPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "MonitorActivityEvent"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      dailyKey: string | null
      organizationId: string | null
      employeeId: string
      employeeName: string | null
      employeeCode: string | null
      deviceId: string
      activityDate: Date | null
      observedAt: Date
      status: string
      activeSeconds: number
      idleSeconds: number
      eventIds: string[]
      createdAt: Date
    }, ExtArgs["result"]["monitorActivityEvent"]>
    composites: {}
  }

  type MonitorActivityEventGetPayload<S extends boolean | null | undefined | MonitorActivityEventDefaultArgs> = $Result.GetResult<Prisma.$MonitorActivityEventPayload, S>

  type MonitorActivityEventCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<MonitorActivityEventFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: MonitorActivityEventCountAggregateInputType | true
    }

  export interface MonitorActivityEventDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['MonitorActivityEvent'], meta: { name: 'MonitorActivityEvent' } }
    /**
     * Find zero or one MonitorActivityEvent that matches the filter.
     * @param {MonitorActivityEventFindUniqueArgs} args - Arguments to find a MonitorActivityEvent
     * @example
     * // Get one MonitorActivityEvent
     * const monitorActivityEvent = await prisma.monitorActivityEvent.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends MonitorActivityEventFindUniqueArgs>(args: SelectSubset<T, MonitorActivityEventFindUniqueArgs<ExtArgs>>): Prisma__MonitorActivityEventClient<$Result.GetResult<Prisma.$MonitorActivityEventPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one MonitorActivityEvent that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {MonitorActivityEventFindUniqueOrThrowArgs} args - Arguments to find a MonitorActivityEvent
     * @example
     * // Get one MonitorActivityEvent
     * const monitorActivityEvent = await prisma.monitorActivityEvent.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends MonitorActivityEventFindUniqueOrThrowArgs>(args: SelectSubset<T, MonitorActivityEventFindUniqueOrThrowArgs<ExtArgs>>): Prisma__MonitorActivityEventClient<$Result.GetResult<Prisma.$MonitorActivityEventPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first MonitorActivityEvent that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MonitorActivityEventFindFirstArgs} args - Arguments to find a MonitorActivityEvent
     * @example
     * // Get one MonitorActivityEvent
     * const monitorActivityEvent = await prisma.monitorActivityEvent.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends MonitorActivityEventFindFirstArgs>(args?: SelectSubset<T, MonitorActivityEventFindFirstArgs<ExtArgs>>): Prisma__MonitorActivityEventClient<$Result.GetResult<Prisma.$MonitorActivityEventPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first MonitorActivityEvent that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MonitorActivityEventFindFirstOrThrowArgs} args - Arguments to find a MonitorActivityEvent
     * @example
     * // Get one MonitorActivityEvent
     * const monitorActivityEvent = await prisma.monitorActivityEvent.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends MonitorActivityEventFindFirstOrThrowArgs>(args?: SelectSubset<T, MonitorActivityEventFindFirstOrThrowArgs<ExtArgs>>): Prisma__MonitorActivityEventClient<$Result.GetResult<Prisma.$MonitorActivityEventPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more MonitorActivityEvents that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MonitorActivityEventFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all MonitorActivityEvents
     * const monitorActivityEvents = await prisma.monitorActivityEvent.findMany()
     * 
     * // Get first 10 MonitorActivityEvents
     * const monitorActivityEvents = await prisma.monitorActivityEvent.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const monitorActivityEventWithIdOnly = await prisma.monitorActivityEvent.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends MonitorActivityEventFindManyArgs>(args?: SelectSubset<T, MonitorActivityEventFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MonitorActivityEventPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a MonitorActivityEvent.
     * @param {MonitorActivityEventCreateArgs} args - Arguments to create a MonitorActivityEvent.
     * @example
     * // Create one MonitorActivityEvent
     * const MonitorActivityEvent = await prisma.monitorActivityEvent.create({
     *   data: {
     *     // ... data to create a MonitorActivityEvent
     *   }
     * })
     * 
     */
    create<T extends MonitorActivityEventCreateArgs>(args: SelectSubset<T, MonitorActivityEventCreateArgs<ExtArgs>>): Prisma__MonitorActivityEventClient<$Result.GetResult<Prisma.$MonitorActivityEventPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many MonitorActivityEvents.
     * @param {MonitorActivityEventCreateManyArgs} args - Arguments to create many MonitorActivityEvents.
     * @example
     * // Create many MonitorActivityEvents
     * const monitorActivityEvent = await prisma.monitorActivityEvent.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends MonitorActivityEventCreateManyArgs>(args?: SelectSubset<T, MonitorActivityEventCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many MonitorActivityEvents and returns the data saved in the database.
     * @param {MonitorActivityEventCreateManyAndReturnArgs} args - Arguments to create many MonitorActivityEvents.
     * @example
     * // Create many MonitorActivityEvents
     * const monitorActivityEvent = await prisma.monitorActivityEvent.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many MonitorActivityEvents and only return the `id`
     * const monitorActivityEventWithIdOnly = await prisma.monitorActivityEvent.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends MonitorActivityEventCreateManyAndReturnArgs>(args?: SelectSubset<T, MonitorActivityEventCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MonitorActivityEventPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a MonitorActivityEvent.
     * @param {MonitorActivityEventDeleteArgs} args - Arguments to delete one MonitorActivityEvent.
     * @example
     * // Delete one MonitorActivityEvent
     * const MonitorActivityEvent = await prisma.monitorActivityEvent.delete({
     *   where: {
     *     // ... filter to delete one MonitorActivityEvent
     *   }
     * })
     * 
     */
    delete<T extends MonitorActivityEventDeleteArgs>(args: SelectSubset<T, MonitorActivityEventDeleteArgs<ExtArgs>>): Prisma__MonitorActivityEventClient<$Result.GetResult<Prisma.$MonitorActivityEventPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one MonitorActivityEvent.
     * @param {MonitorActivityEventUpdateArgs} args - Arguments to update one MonitorActivityEvent.
     * @example
     * // Update one MonitorActivityEvent
     * const monitorActivityEvent = await prisma.monitorActivityEvent.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends MonitorActivityEventUpdateArgs>(args: SelectSubset<T, MonitorActivityEventUpdateArgs<ExtArgs>>): Prisma__MonitorActivityEventClient<$Result.GetResult<Prisma.$MonitorActivityEventPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more MonitorActivityEvents.
     * @param {MonitorActivityEventDeleteManyArgs} args - Arguments to filter MonitorActivityEvents to delete.
     * @example
     * // Delete a few MonitorActivityEvents
     * const { count } = await prisma.monitorActivityEvent.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends MonitorActivityEventDeleteManyArgs>(args?: SelectSubset<T, MonitorActivityEventDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more MonitorActivityEvents.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MonitorActivityEventUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many MonitorActivityEvents
     * const monitorActivityEvent = await prisma.monitorActivityEvent.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends MonitorActivityEventUpdateManyArgs>(args: SelectSubset<T, MonitorActivityEventUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more MonitorActivityEvents and returns the data updated in the database.
     * @param {MonitorActivityEventUpdateManyAndReturnArgs} args - Arguments to update many MonitorActivityEvents.
     * @example
     * // Update many MonitorActivityEvents
     * const monitorActivityEvent = await prisma.monitorActivityEvent.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more MonitorActivityEvents and only return the `id`
     * const monitorActivityEventWithIdOnly = await prisma.monitorActivityEvent.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends MonitorActivityEventUpdateManyAndReturnArgs>(args: SelectSubset<T, MonitorActivityEventUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MonitorActivityEventPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one MonitorActivityEvent.
     * @param {MonitorActivityEventUpsertArgs} args - Arguments to update or create a MonitorActivityEvent.
     * @example
     * // Update or create a MonitorActivityEvent
     * const monitorActivityEvent = await prisma.monitorActivityEvent.upsert({
     *   create: {
     *     // ... data to create a MonitorActivityEvent
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the MonitorActivityEvent we want to update
     *   }
     * })
     */
    upsert<T extends MonitorActivityEventUpsertArgs>(args: SelectSubset<T, MonitorActivityEventUpsertArgs<ExtArgs>>): Prisma__MonitorActivityEventClient<$Result.GetResult<Prisma.$MonitorActivityEventPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of MonitorActivityEvents.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MonitorActivityEventCountArgs} args - Arguments to filter MonitorActivityEvents to count.
     * @example
     * // Count the number of MonitorActivityEvents
     * const count = await prisma.monitorActivityEvent.count({
     *   where: {
     *     // ... the filter for the MonitorActivityEvents we want to count
     *   }
     * })
    **/
    count<T extends MonitorActivityEventCountArgs>(
      args?: Subset<T, MonitorActivityEventCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], MonitorActivityEventCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a MonitorActivityEvent.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MonitorActivityEventAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends MonitorActivityEventAggregateArgs>(args: Subset<T, MonitorActivityEventAggregateArgs>): Prisma.PrismaPromise<GetMonitorActivityEventAggregateType<T>>

    /**
     * Group by MonitorActivityEvent.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MonitorActivityEventGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends MonitorActivityEventGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: MonitorActivityEventGroupByArgs['orderBy'] }
        : { orderBy?: MonitorActivityEventGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, MonitorActivityEventGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetMonitorActivityEventGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the MonitorActivityEvent model
   */
  readonly fields: MonitorActivityEventFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for MonitorActivityEvent.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__MonitorActivityEventClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the MonitorActivityEvent model
   */
  interface MonitorActivityEventFieldRefs {
    readonly id: FieldRef<"MonitorActivityEvent", 'String'>
    readonly dailyKey: FieldRef<"MonitorActivityEvent", 'String'>
    readonly organizationId: FieldRef<"MonitorActivityEvent", 'String'>
    readonly employeeId: FieldRef<"MonitorActivityEvent", 'String'>
    readonly employeeName: FieldRef<"MonitorActivityEvent", 'String'>
    readonly employeeCode: FieldRef<"MonitorActivityEvent", 'String'>
    readonly deviceId: FieldRef<"MonitorActivityEvent", 'String'>
    readonly activityDate: FieldRef<"MonitorActivityEvent", 'DateTime'>
    readonly observedAt: FieldRef<"MonitorActivityEvent", 'DateTime'>
    readonly status: FieldRef<"MonitorActivityEvent", 'String'>
    readonly activeSeconds: FieldRef<"MonitorActivityEvent", 'Int'>
    readonly idleSeconds: FieldRef<"MonitorActivityEvent", 'Int'>
    readonly eventIds: FieldRef<"MonitorActivityEvent", 'String[]'>
    readonly createdAt: FieldRef<"MonitorActivityEvent", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * MonitorActivityEvent findUnique
   */
  export type MonitorActivityEventFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorActivityEvent
     */
    select?: MonitorActivityEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorActivityEvent
     */
    omit?: MonitorActivityEventOmit<ExtArgs> | null
    /**
     * Filter, which MonitorActivityEvent to fetch.
     */
    where: MonitorActivityEventWhereUniqueInput
  }

  /**
   * MonitorActivityEvent findUniqueOrThrow
   */
  export type MonitorActivityEventFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorActivityEvent
     */
    select?: MonitorActivityEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorActivityEvent
     */
    omit?: MonitorActivityEventOmit<ExtArgs> | null
    /**
     * Filter, which MonitorActivityEvent to fetch.
     */
    where: MonitorActivityEventWhereUniqueInput
  }

  /**
   * MonitorActivityEvent findFirst
   */
  export type MonitorActivityEventFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorActivityEvent
     */
    select?: MonitorActivityEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorActivityEvent
     */
    omit?: MonitorActivityEventOmit<ExtArgs> | null
    /**
     * Filter, which MonitorActivityEvent to fetch.
     */
    where?: MonitorActivityEventWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MonitorActivityEvents to fetch.
     */
    orderBy?: MonitorActivityEventOrderByWithRelationInput | MonitorActivityEventOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for MonitorActivityEvents.
     */
    cursor?: MonitorActivityEventWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MonitorActivityEvents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MonitorActivityEvents.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of MonitorActivityEvents.
     */
    distinct?: MonitorActivityEventScalarFieldEnum | MonitorActivityEventScalarFieldEnum[]
  }

  /**
   * MonitorActivityEvent findFirstOrThrow
   */
  export type MonitorActivityEventFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorActivityEvent
     */
    select?: MonitorActivityEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorActivityEvent
     */
    omit?: MonitorActivityEventOmit<ExtArgs> | null
    /**
     * Filter, which MonitorActivityEvent to fetch.
     */
    where?: MonitorActivityEventWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MonitorActivityEvents to fetch.
     */
    orderBy?: MonitorActivityEventOrderByWithRelationInput | MonitorActivityEventOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for MonitorActivityEvents.
     */
    cursor?: MonitorActivityEventWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MonitorActivityEvents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MonitorActivityEvents.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of MonitorActivityEvents.
     */
    distinct?: MonitorActivityEventScalarFieldEnum | MonitorActivityEventScalarFieldEnum[]
  }

  /**
   * MonitorActivityEvent findMany
   */
  export type MonitorActivityEventFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorActivityEvent
     */
    select?: MonitorActivityEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorActivityEvent
     */
    omit?: MonitorActivityEventOmit<ExtArgs> | null
    /**
     * Filter, which MonitorActivityEvents to fetch.
     */
    where?: MonitorActivityEventWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MonitorActivityEvents to fetch.
     */
    orderBy?: MonitorActivityEventOrderByWithRelationInput | MonitorActivityEventOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing MonitorActivityEvents.
     */
    cursor?: MonitorActivityEventWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MonitorActivityEvents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MonitorActivityEvents.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of MonitorActivityEvents.
     */
    distinct?: MonitorActivityEventScalarFieldEnum | MonitorActivityEventScalarFieldEnum[]
  }

  /**
   * MonitorActivityEvent create
   */
  export type MonitorActivityEventCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorActivityEvent
     */
    select?: MonitorActivityEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorActivityEvent
     */
    omit?: MonitorActivityEventOmit<ExtArgs> | null
    /**
     * The data needed to create a MonitorActivityEvent.
     */
    data: XOR<MonitorActivityEventCreateInput, MonitorActivityEventUncheckedCreateInput>
  }

  /**
   * MonitorActivityEvent createMany
   */
  export type MonitorActivityEventCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many MonitorActivityEvents.
     */
    data: MonitorActivityEventCreateManyInput | MonitorActivityEventCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * MonitorActivityEvent createManyAndReturn
   */
  export type MonitorActivityEventCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorActivityEvent
     */
    select?: MonitorActivityEventSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorActivityEvent
     */
    omit?: MonitorActivityEventOmit<ExtArgs> | null
    /**
     * The data used to create many MonitorActivityEvents.
     */
    data: MonitorActivityEventCreateManyInput | MonitorActivityEventCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * MonitorActivityEvent update
   */
  export type MonitorActivityEventUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorActivityEvent
     */
    select?: MonitorActivityEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorActivityEvent
     */
    omit?: MonitorActivityEventOmit<ExtArgs> | null
    /**
     * The data needed to update a MonitorActivityEvent.
     */
    data: XOR<MonitorActivityEventUpdateInput, MonitorActivityEventUncheckedUpdateInput>
    /**
     * Choose, which MonitorActivityEvent to update.
     */
    where: MonitorActivityEventWhereUniqueInput
  }

  /**
   * MonitorActivityEvent updateMany
   */
  export type MonitorActivityEventUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update MonitorActivityEvents.
     */
    data: XOR<MonitorActivityEventUpdateManyMutationInput, MonitorActivityEventUncheckedUpdateManyInput>
    /**
     * Filter which MonitorActivityEvents to update
     */
    where?: MonitorActivityEventWhereInput
    /**
     * Limit how many MonitorActivityEvents to update.
     */
    limit?: number
  }

  /**
   * MonitorActivityEvent updateManyAndReturn
   */
  export type MonitorActivityEventUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorActivityEvent
     */
    select?: MonitorActivityEventSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorActivityEvent
     */
    omit?: MonitorActivityEventOmit<ExtArgs> | null
    /**
     * The data used to update MonitorActivityEvents.
     */
    data: XOR<MonitorActivityEventUpdateManyMutationInput, MonitorActivityEventUncheckedUpdateManyInput>
    /**
     * Filter which MonitorActivityEvents to update
     */
    where?: MonitorActivityEventWhereInput
    /**
     * Limit how many MonitorActivityEvents to update.
     */
    limit?: number
  }

  /**
   * MonitorActivityEvent upsert
   */
  export type MonitorActivityEventUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorActivityEvent
     */
    select?: MonitorActivityEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorActivityEvent
     */
    omit?: MonitorActivityEventOmit<ExtArgs> | null
    /**
     * The filter to search for the MonitorActivityEvent to update in case it exists.
     */
    where: MonitorActivityEventWhereUniqueInput
    /**
     * In case the MonitorActivityEvent found by the `where` argument doesn't exist, create a new MonitorActivityEvent with this data.
     */
    create: XOR<MonitorActivityEventCreateInput, MonitorActivityEventUncheckedCreateInput>
    /**
     * In case the MonitorActivityEvent was found with the provided `where` argument, update it with this data.
     */
    update: XOR<MonitorActivityEventUpdateInput, MonitorActivityEventUncheckedUpdateInput>
  }

  /**
   * MonitorActivityEvent delete
   */
  export type MonitorActivityEventDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorActivityEvent
     */
    select?: MonitorActivityEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorActivityEvent
     */
    omit?: MonitorActivityEventOmit<ExtArgs> | null
    /**
     * Filter which MonitorActivityEvent to delete.
     */
    where: MonitorActivityEventWhereUniqueInput
  }

  /**
   * MonitorActivityEvent deleteMany
   */
  export type MonitorActivityEventDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which MonitorActivityEvents to delete
     */
    where?: MonitorActivityEventWhereInput
    /**
     * Limit how many MonitorActivityEvents to delete.
     */
    limit?: number
  }

  /**
   * MonitorActivityEvent without action
   */
  export type MonitorActivityEventDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorActivityEvent
     */
    select?: MonitorActivityEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorActivityEvent
     */
    omit?: MonitorActivityEventOmit<ExtArgs> | null
  }


  /**
   * Model MonitorDevicePresence
   */

  export type AggregateMonitorDevicePresence = {
    _count: MonitorDevicePresenceCountAggregateOutputType | null
    _min: MonitorDevicePresenceMinAggregateOutputType | null
    _max: MonitorDevicePresenceMaxAggregateOutputType | null
  }

  export type MonitorDevicePresenceMinAggregateOutputType = {
    deviceId: string | null
    organizationId: string | null
    employeeId: string | null
    employeeName: string | null
    status: string | null
    lastSeenAt: Date | null
    updatedAt: Date | null
  }

  export type MonitorDevicePresenceMaxAggregateOutputType = {
    deviceId: string | null
    organizationId: string | null
    employeeId: string | null
    employeeName: string | null
    status: string | null
    lastSeenAt: Date | null
    updatedAt: Date | null
  }

  export type MonitorDevicePresenceCountAggregateOutputType = {
    deviceId: number
    organizationId: number
    employeeId: number
    employeeName: number
    status: number
    lastSeenAt: number
    updatedAt: number
    _all: number
  }


  export type MonitorDevicePresenceMinAggregateInputType = {
    deviceId?: true
    organizationId?: true
    employeeId?: true
    employeeName?: true
    status?: true
    lastSeenAt?: true
    updatedAt?: true
  }

  export type MonitorDevicePresenceMaxAggregateInputType = {
    deviceId?: true
    organizationId?: true
    employeeId?: true
    employeeName?: true
    status?: true
    lastSeenAt?: true
    updatedAt?: true
  }

  export type MonitorDevicePresenceCountAggregateInputType = {
    deviceId?: true
    organizationId?: true
    employeeId?: true
    employeeName?: true
    status?: true
    lastSeenAt?: true
    updatedAt?: true
    _all?: true
  }

  export type MonitorDevicePresenceAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which MonitorDevicePresence to aggregate.
     */
    where?: MonitorDevicePresenceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MonitorDevicePresences to fetch.
     */
    orderBy?: MonitorDevicePresenceOrderByWithRelationInput | MonitorDevicePresenceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: MonitorDevicePresenceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MonitorDevicePresences from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MonitorDevicePresences.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned MonitorDevicePresences
    **/
    _count?: true | MonitorDevicePresenceCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: MonitorDevicePresenceMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: MonitorDevicePresenceMaxAggregateInputType
  }

  export type GetMonitorDevicePresenceAggregateType<T extends MonitorDevicePresenceAggregateArgs> = {
        [P in keyof T & keyof AggregateMonitorDevicePresence]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateMonitorDevicePresence[P]>
      : GetScalarType<T[P], AggregateMonitorDevicePresence[P]>
  }




  export type MonitorDevicePresenceGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: MonitorDevicePresenceWhereInput
    orderBy?: MonitorDevicePresenceOrderByWithAggregationInput | MonitorDevicePresenceOrderByWithAggregationInput[]
    by: MonitorDevicePresenceScalarFieldEnum[] | MonitorDevicePresenceScalarFieldEnum
    having?: MonitorDevicePresenceScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: MonitorDevicePresenceCountAggregateInputType | true
    _min?: MonitorDevicePresenceMinAggregateInputType
    _max?: MonitorDevicePresenceMaxAggregateInputType
  }

  export type MonitorDevicePresenceGroupByOutputType = {
    deviceId: string
    organizationId: string | null
    employeeId: string
    employeeName: string | null
    status: string
    lastSeenAt: Date
    updatedAt: Date
    _count: MonitorDevicePresenceCountAggregateOutputType | null
    _min: MonitorDevicePresenceMinAggregateOutputType | null
    _max: MonitorDevicePresenceMaxAggregateOutputType | null
  }

  type GetMonitorDevicePresenceGroupByPayload<T extends MonitorDevicePresenceGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<MonitorDevicePresenceGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof MonitorDevicePresenceGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], MonitorDevicePresenceGroupByOutputType[P]>
            : GetScalarType<T[P], MonitorDevicePresenceGroupByOutputType[P]>
        }
      >
    >


  export type MonitorDevicePresenceSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    deviceId?: boolean
    organizationId?: boolean
    employeeId?: boolean
    employeeName?: boolean
    status?: boolean
    lastSeenAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["monitorDevicePresence"]>

  export type MonitorDevicePresenceSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    deviceId?: boolean
    organizationId?: boolean
    employeeId?: boolean
    employeeName?: boolean
    status?: boolean
    lastSeenAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["monitorDevicePresence"]>

  export type MonitorDevicePresenceSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    deviceId?: boolean
    organizationId?: boolean
    employeeId?: boolean
    employeeName?: boolean
    status?: boolean
    lastSeenAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["monitorDevicePresence"]>

  export type MonitorDevicePresenceSelectScalar = {
    deviceId?: boolean
    organizationId?: boolean
    employeeId?: boolean
    employeeName?: boolean
    status?: boolean
    lastSeenAt?: boolean
    updatedAt?: boolean
  }

  export type MonitorDevicePresenceOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"deviceId" | "organizationId" | "employeeId" | "employeeName" | "status" | "lastSeenAt" | "updatedAt", ExtArgs["result"]["monitorDevicePresence"]>

  export type $MonitorDevicePresencePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "MonitorDevicePresence"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      deviceId: string
      organizationId: string | null
      employeeId: string
      employeeName: string | null
      status: string
      lastSeenAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["monitorDevicePresence"]>
    composites: {}
  }

  type MonitorDevicePresenceGetPayload<S extends boolean | null | undefined | MonitorDevicePresenceDefaultArgs> = $Result.GetResult<Prisma.$MonitorDevicePresencePayload, S>

  type MonitorDevicePresenceCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<MonitorDevicePresenceFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: MonitorDevicePresenceCountAggregateInputType | true
    }

  export interface MonitorDevicePresenceDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['MonitorDevicePresence'], meta: { name: 'MonitorDevicePresence' } }
    /**
     * Find zero or one MonitorDevicePresence that matches the filter.
     * @param {MonitorDevicePresenceFindUniqueArgs} args - Arguments to find a MonitorDevicePresence
     * @example
     * // Get one MonitorDevicePresence
     * const monitorDevicePresence = await prisma.monitorDevicePresence.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends MonitorDevicePresenceFindUniqueArgs>(args: SelectSubset<T, MonitorDevicePresenceFindUniqueArgs<ExtArgs>>): Prisma__MonitorDevicePresenceClient<$Result.GetResult<Prisma.$MonitorDevicePresencePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one MonitorDevicePresence that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {MonitorDevicePresenceFindUniqueOrThrowArgs} args - Arguments to find a MonitorDevicePresence
     * @example
     * // Get one MonitorDevicePresence
     * const monitorDevicePresence = await prisma.monitorDevicePresence.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends MonitorDevicePresenceFindUniqueOrThrowArgs>(args: SelectSubset<T, MonitorDevicePresenceFindUniqueOrThrowArgs<ExtArgs>>): Prisma__MonitorDevicePresenceClient<$Result.GetResult<Prisma.$MonitorDevicePresencePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first MonitorDevicePresence that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MonitorDevicePresenceFindFirstArgs} args - Arguments to find a MonitorDevicePresence
     * @example
     * // Get one MonitorDevicePresence
     * const monitorDevicePresence = await prisma.monitorDevicePresence.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends MonitorDevicePresenceFindFirstArgs>(args?: SelectSubset<T, MonitorDevicePresenceFindFirstArgs<ExtArgs>>): Prisma__MonitorDevicePresenceClient<$Result.GetResult<Prisma.$MonitorDevicePresencePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first MonitorDevicePresence that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MonitorDevicePresenceFindFirstOrThrowArgs} args - Arguments to find a MonitorDevicePresence
     * @example
     * // Get one MonitorDevicePresence
     * const monitorDevicePresence = await prisma.monitorDevicePresence.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends MonitorDevicePresenceFindFirstOrThrowArgs>(args?: SelectSubset<T, MonitorDevicePresenceFindFirstOrThrowArgs<ExtArgs>>): Prisma__MonitorDevicePresenceClient<$Result.GetResult<Prisma.$MonitorDevicePresencePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more MonitorDevicePresences that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MonitorDevicePresenceFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all MonitorDevicePresences
     * const monitorDevicePresences = await prisma.monitorDevicePresence.findMany()
     * 
     * // Get first 10 MonitorDevicePresences
     * const monitorDevicePresences = await prisma.monitorDevicePresence.findMany({ take: 10 })
     * 
     * // Only select the `deviceId`
     * const monitorDevicePresenceWithDeviceIdOnly = await prisma.monitorDevicePresence.findMany({ select: { deviceId: true } })
     * 
     */
    findMany<T extends MonitorDevicePresenceFindManyArgs>(args?: SelectSubset<T, MonitorDevicePresenceFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MonitorDevicePresencePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a MonitorDevicePresence.
     * @param {MonitorDevicePresenceCreateArgs} args - Arguments to create a MonitorDevicePresence.
     * @example
     * // Create one MonitorDevicePresence
     * const MonitorDevicePresence = await prisma.monitorDevicePresence.create({
     *   data: {
     *     // ... data to create a MonitorDevicePresence
     *   }
     * })
     * 
     */
    create<T extends MonitorDevicePresenceCreateArgs>(args: SelectSubset<T, MonitorDevicePresenceCreateArgs<ExtArgs>>): Prisma__MonitorDevicePresenceClient<$Result.GetResult<Prisma.$MonitorDevicePresencePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many MonitorDevicePresences.
     * @param {MonitorDevicePresenceCreateManyArgs} args - Arguments to create many MonitorDevicePresences.
     * @example
     * // Create many MonitorDevicePresences
     * const monitorDevicePresence = await prisma.monitorDevicePresence.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends MonitorDevicePresenceCreateManyArgs>(args?: SelectSubset<T, MonitorDevicePresenceCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many MonitorDevicePresences and returns the data saved in the database.
     * @param {MonitorDevicePresenceCreateManyAndReturnArgs} args - Arguments to create many MonitorDevicePresences.
     * @example
     * // Create many MonitorDevicePresences
     * const monitorDevicePresence = await prisma.monitorDevicePresence.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many MonitorDevicePresences and only return the `deviceId`
     * const monitorDevicePresenceWithDeviceIdOnly = await prisma.monitorDevicePresence.createManyAndReturn({
     *   select: { deviceId: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends MonitorDevicePresenceCreateManyAndReturnArgs>(args?: SelectSubset<T, MonitorDevicePresenceCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MonitorDevicePresencePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a MonitorDevicePresence.
     * @param {MonitorDevicePresenceDeleteArgs} args - Arguments to delete one MonitorDevicePresence.
     * @example
     * // Delete one MonitorDevicePresence
     * const MonitorDevicePresence = await prisma.monitorDevicePresence.delete({
     *   where: {
     *     // ... filter to delete one MonitorDevicePresence
     *   }
     * })
     * 
     */
    delete<T extends MonitorDevicePresenceDeleteArgs>(args: SelectSubset<T, MonitorDevicePresenceDeleteArgs<ExtArgs>>): Prisma__MonitorDevicePresenceClient<$Result.GetResult<Prisma.$MonitorDevicePresencePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one MonitorDevicePresence.
     * @param {MonitorDevicePresenceUpdateArgs} args - Arguments to update one MonitorDevicePresence.
     * @example
     * // Update one MonitorDevicePresence
     * const monitorDevicePresence = await prisma.monitorDevicePresence.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends MonitorDevicePresenceUpdateArgs>(args: SelectSubset<T, MonitorDevicePresenceUpdateArgs<ExtArgs>>): Prisma__MonitorDevicePresenceClient<$Result.GetResult<Prisma.$MonitorDevicePresencePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more MonitorDevicePresences.
     * @param {MonitorDevicePresenceDeleteManyArgs} args - Arguments to filter MonitorDevicePresences to delete.
     * @example
     * // Delete a few MonitorDevicePresences
     * const { count } = await prisma.monitorDevicePresence.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends MonitorDevicePresenceDeleteManyArgs>(args?: SelectSubset<T, MonitorDevicePresenceDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more MonitorDevicePresences.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MonitorDevicePresenceUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many MonitorDevicePresences
     * const monitorDevicePresence = await prisma.monitorDevicePresence.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends MonitorDevicePresenceUpdateManyArgs>(args: SelectSubset<T, MonitorDevicePresenceUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more MonitorDevicePresences and returns the data updated in the database.
     * @param {MonitorDevicePresenceUpdateManyAndReturnArgs} args - Arguments to update many MonitorDevicePresences.
     * @example
     * // Update many MonitorDevicePresences
     * const monitorDevicePresence = await prisma.monitorDevicePresence.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more MonitorDevicePresences and only return the `deviceId`
     * const monitorDevicePresenceWithDeviceIdOnly = await prisma.monitorDevicePresence.updateManyAndReturn({
     *   select: { deviceId: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends MonitorDevicePresenceUpdateManyAndReturnArgs>(args: SelectSubset<T, MonitorDevicePresenceUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MonitorDevicePresencePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one MonitorDevicePresence.
     * @param {MonitorDevicePresenceUpsertArgs} args - Arguments to update or create a MonitorDevicePresence.
     * @example
     * // Update or create a MonitorDevicePresence
     * const monitorDevicePresence = await prisma.monitorDevicePresence.upsert({
     *   create: {
     *     // ... data to create a MonitorDevicePresence
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the MonitorDevicePresence we want to update
     *   }
     * })
     */
    upsert<T extends MonitorDevicePresenceUpsertArgs>(args: SelectSubset<T, MonitorDevicePresenceUpsertArgs<ExtArgs>>): Prisma__MonitorDevicePresenceClient<$Result.GetResult<Prisma.$MonitorDevicePresencePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of MonitorDevicePresences.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MonitorDevicePresenceCountArgs} args - Arguments to filter MonitorDevicePresences to count.
     * @example
     * // Count the number of MonitorDevicePresences
     * const count = await prisma.monitorDevicePresence.count({
     *   where: {
     *     // ... the filter for the MonitorDevicePresences we want to count
     *   }
     * })
    **/
    count<T extends MonitorDevicePresenceCountArgs>(
      args?: Subset<T, MonitorDevicePresenceCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], MonitorDevicePresenceCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a MonitorDevicePresence.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MonitorDevicePresenceAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends MonitorDevicePresenceAggregateArgs>(args: Subset<T, MonitorDevicePresenceAggregateArgs>): Prisma.PrismaPromise<GetMonitorDevicePresenceAggregateType<T>>

    /**
     * Group by MonitorDevicePresence.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MonitorDevicePresenceGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends MonitorDevicePresenceGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: MonitorDevicePresenceGroupByArgs['orderBy'] }
        : { orderBy?: MonitorDevicePresenceGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, MonitorDevicePresenceGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetMonitorDevicePresenceGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the MonitorDevicePresence model
   */
  readonly fields: MonitorDevicePresenceFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for MonitorDevicePresence.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__MonitorDevicePresenceClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the MonitorDevicePresence model
   */
  interface MonitorDevicePresenceFieldRefs {
    readonly deviceId: FieldRef<"MonitorDevicePresence", 'String'>
    readonly organizationId: FieldRef<"MonitorDevicePresence", 'String'>
    readonly employeeId: FieldRef<"MonitorDevicePresence", 'String'>
    readonly employeeName: FieldRef<"MonitorDevicePresence", 'String'>
    readonly status: FieldRef<"MonitorDevicePresence", 'String'>
    readonly lastSeenAt: FieldRef<"MonitorDevicePresence", 'DateTime'>
    readonly updatedAt: FieldRef<"MonitorDevicePresence", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * MonitorDevicePresence findUnique
   */
  export type MonitorDevicePresenceFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorDevicePresence
     */
    select?: MonitorDevicePresenceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorDevicePresence
     */
    omit?: MonitorDevicePresenceOmit<ExtArgs> | null
    /**
     * Filter, which MonitorDevicePresence to fetch.
     */
    where: MonitorDevicePresenceWhereUniqueInput
  }

  /**
   * MonitorDevicePresence findUniqueOrThrow
   */
  export type MonitorDevicePresenceFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorDevicePresence
     */
    select?: MonitorDevicePresenceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorDevicePresence
     */
    omit?: MonitorDevicePresenceOmit<ExtArgs> | null
    /**
     * Filter, which MonitorDevicePresence to fetch.
     */
    where: MonitorDevicePresenceWhereUniqueInput
  }

  /**
   * MonitorDevicePresence findFirst
   */
  export type MonitorDevicePresenceFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorDevicePresence
     */
    select?: MonitorDevicePresenceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorDevicePresence
     */
    omit?: MonitorDevicePresenceOmit<ExtArgs> | null
    /**
     * Filter, which MonitorDevicePresence to fetch.
     */
    where?: MonitorDevicePresenceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MonitorDevicePresences to fetch.
     */
    orderBy?: MonitorDevicePresenceOrderByWithRelationInput | MonitorDevicePresenceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for MonitorDevicePresences.
     */
    cursor?: MonitorDevicePresenceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MonitorDevicePresences from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MonitorDevicePresences.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of MonitorDevicePresences.
     */
    distinct?: MonitorDevicePresenceScalarFieldEnum | MonitorDevicePresenceScalarFieldEnum[]
  }

  /**
   * MonitorDevicePresence findFirstOrThrow
   */
  export type MonitorDevicePresenceFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorDevicePresence
     */
    select?: MonitorDevicePresenceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorDevicePresence
     */
    omit?: MonitorDevicePresenceOmit<ExtArgs> | null
    /**
     * Filter, which MonitorDevicePresence to fetch.
     */
    where?: MonitorDevicePresenceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MonitorDevicePresences to fetch.
     */
    orderBy?: MonitorDevicePresenceOrderByWithRelationInput | MonitorDevicePresenceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for MonitorDevicePresences.
     */
    cursor?: MonitorDevicePresenceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MonitorDevicePresences from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MonitorDevicePresences.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of MonitorDevicePresences.
     */
    distinct?: MonitorDevicePresenceScalarFieldEnum | MonitorDevicePresenceScalarFieldEnum[]
  }

  /**
   * MonitorDevicePresence findMany
   */
  export type MonitorDevicePresenceFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorDevicePresence
     */
    select?: MonitorDevicePresenceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorDevicePresence
     */
    omit?: MonitorDevicePresenceOmit<ExtArgs> | null
    /**
     * Filter, which MonitorDevicePresences to fetch.
     */
    where?: MonitorDevicePresenceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MonitorDevicePresences to fetch.
     */
    orderBy?: MonitorDevicePresenceOrderByWithRelationInput | MonitorDevicePresenceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing MonitorDevicePresences.
     */
    cursor?: MonitorDevicePresenceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MonitorDevicePresences from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MonitorDevicePresences.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of MonitorDevicePresences.
     */
    distinct?: MonitorDevicePresenceScalarFieldEnum | MonitorDevicePresenceScalarFieldEnum[]
  }

  /**
   * MonitorDevicePresence create
   */
  export type MonitorDevicePresenceCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorDevicePresence
     */
    select?: MonitorDevicePresenceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorDevicePresence
     */
    omit?: MonitorDevicePresenceOmit<ExtArgs> | null
    /**
     * The data needed to create a MonitorDevicePresence.
     */
    data: XOR<MonitorDevicePresenceCreateInput, MonitorDevicePresenceUncheckedCreateInput>
  }

  /**
   * MonitorDevicePresence createMany
   */
  export type MonitorDevicePresenceCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many MonitorDevicePresences.
     */
    data: MonitorDevicePresenceCreateManyInput | MonitorDevicePresenceCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * MonitorDevicePresence createManyAndReturn
   */
  export type MonitorDevicePresenceCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorDevicePresence
     */
    select?: MonitorDevicePresenceSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorDevicePresence
     */
    omit?: MonitorDevicePresenceOmit<ExtArgs> | null
    /**
     * The data used to create many MonitorDevicePresences.
     */
    data: MonitorDevicePresenceCreateManyInput | MonitorDevicePresenceCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * MonitorDevicePresence update
   */
  export type MonitorDevicePresenceUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorDevicePresence
     */
    select?: MonitorDevicePresenceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorDevicePresence
     */
    omit?: MonitorDevicePresenceOmit<ExtArgs> | null
    /**
     * The data needed to update a MonitorDevicePresence.
     */
    data: XOR<MonitorDevicePresenceUpdateInput, MonitorDevicePresenceUncheckedUpdateInput>
    /**
     * Choose, which MonitorDevicePresence to update.
     */
    where: MonitorDevicePresenceWhereUniqueInput
  }

  /**
   * MonitorDevicePresence updateMany
   */
  export type MonitorDevicePresenceUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update MonitorDevicePresences.
     */
    data: XOR<MonitorDevicePresenceUpdateManyMutationInput, MonitorDevicePresenceUncheckedUpdateManyInput>
    /**
     * Filter which MonitorDevicePresences to update
     */
    where?: MonitorDevicePresenceWhereInput
    /**
     * Limit how many MonitorDevicePresences to update.
     */
    limit?: number
  }

  /**
   * MonitorDevicePresence updateManyAndReturn
   */
  export type MonitorDevicePresenceUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorDevicePresence
     */
    select?: MonitorDevicePresenceSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorDevicePresence
     */
    omit?: MonitorDevicePresenceOmit<ExtArgs> | null
    /**
     * The data used to update MonitorDevicePresences.
     */
    data: XOR<MonitorDevicePresenceUpdateManyMutationInput, MonitorDevicePresenceUncheckedUpdateManyInput>
    /**
     * Filter which MonitorDevicePresences to update
     */
    where?: MonitorDevicePresenceWhereInput
    /**
     * Limit how many MonitorDevicePresences to update.
     */
    limit?: number
  }

  /**
   * MonitorDevicePresence upsert
   */
  export type MonitorDevicePresenceUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorDevicePresence
     */
    select?: MonitorDevicePresenceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorDevicePresence
     */
    omit?: MonitorDevicePresenceOmit<ExtArgs> | null
    /**
     * The filter to search for the MonitorDevicePresence to update in case it exists.
     */
    where: MonitorDevicePresenceWhereUniqueInput
    /**
     * In case the MonitorDevicePresence found by the `where` argument doesn't exist, create a new MonitorDevicePresence with this data.
     */
    create: XOR<MonitorDevicePresenceCreateInput, MonitorDevicePresenceUncheckedCreateInput>
    /**
     * In case the MonitorDevicePresence was found with the provided `where` argument, update it with this data.
     */
    update: XOR<MonitorDevicePresenceUpdateInput, MonitorDevicePresenceUncheckedUpdateInput>
  }

  /**
   * MonitorDevicePresence delete
   */
  export type MonitorDevicePresenceDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorDevicePresence
     */
    select?: MonitorDevicePresenceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorDevicePresence
     */
    omit?: MonitorDevicePresenceOmit<ExtArgs> | null
    /**
     * Filter which MonitorDevicePresence to delete.
     */
    where: MonitorDevicePresenceWhereUniqueInput
  }

  /**
   * MonitorDevicePresence deleteMany
   */
  export type MonitorDevicePresenceDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which MonitorDevicePresences to delete
     */
    where?: MonitorDevicePresenceWhereInput
    /**
     * Limit how many MonitorDevicePresences to delete.
     */
    limit?: number
  }

  /**
   * MonitorDevicePresence without action
   */
  export type MonitorDevicePresenceDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorDevicePresence
     */
    select?: MonitorDevicePresenceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorDevicePresence
     */
    omit?: MonitorDevicePresenceOmit<ExtArgs> | null
  }


  /**
   * Model MonitorBrowserHistory
   */

  export type AggregateMonitorBrowserHistory = {
    _count: MonitorBrowserHistoryCountAggregateOutputType | null
    _avg: MonitorBrowserHistoryAvgAggregateOutputType | null
    _sum: MonitorBrowserHistorySumAggregateOutputType | null
    _min: MonitorBrowserHistoryMinAggregateOutputType | null
    _max: MonitorBrowserHistoryMaxAggregateOutputType | null
  }

  export type MonitorBrowserHistoryAvgAggregateOutputType = {
    durationMs: number | null
  }

  export type MonitorBrowserHistorySumAggregateOutputType = {
    durationMs: number | null
  }

  export type MonitorBrowserHistoryMinAggregateOutputType = {
    entryId: string | null
    organizationId: string | null
    employeeId: string | null
    employeeName: string | null
    deviceId: string | null
    observedAt: Date | null
    browser: string | null
    url: string | null
    title: string | null
    activeWindowTitle: string | null
    durationMs: number | null
    createdAt: Date | null
  }

  export type MonitorBrowserHistoryMaxAggregateOutputType = {
    entryId: string | null
    organizationId: string | null
    employeeId: string | null
    employeeName: string | null
    deviceId: string | null
    observedAt: Date | null
    browser: string | null
    url: string | null
    title: string | null
    activeWindowTitle: string | null
    durationMs: number | null
    createdAt: Date | null
  }

  export type MonitorBrowserHistoryCountAggregateOutputType = {
    entryId: number
    organizationId: number
    employeeId: number
    employeeName: number
    deviceId: number
    observedAt: number
    browser: number
    url: number
    title: number
    activeWindowTitle: number
    durationMs: number
    createdAt: number
    _all: number
  }


  export type MonitorBrowserHistoryAvgAggregateInputType = {
    durationMs?: true
  }

  export type MonitorBrowserHistorySumAggregateInputType = {
    durationMs?: true
  }

  export type MonitorBrowserHistoryMinAggregateInputType = {
    entryId?: true
    organizationId?: true
    employeeId?: true
    employeeName?: true
    deviceId?: true
    observedAt?: true
    browser?: true
    url?: true
    title?: true
    activeWindowTitle?: true
    durationMs?: true
    createdAt?: true
  }

  export type MonitorBrowserHistoryMaxAggregateInputType = {
    entryId?: true
    organizationId?: true
    employeeId?: true
    employeeName?: true
    deviceId?: true
    observedAt?: true
    browser?: true
    url?: true
    title?: true
    activeWindowTitle?: true
    durationMs?: true
    createdAt?: true
  }

  export type MonitorBrowserHistoryCountAggregateInputType = {
    entryId?: true
    organizationId?: true
    employeeId?: true
    employeeName?: true
    deviceId?: true
    observedAt?: true
    browser?: true
    url?: true
    title?: true
    activeWindowTitle?: true
    durationMs?: true
    createdAt?: true
    _all?: true
  }

  export type MonitorBrowserHistoryAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which MonitorBrowserHistory to aggregate.
     */
    where?: MonitorBrowserHistoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MonitorBrowserHistories to fetch.
     */
    orderBy?: MonitorBrowserHistoryOrderByWithRelationInput | MonitorBrowserHistoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: MonitorBrowserHistoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MonitorBrowserHistories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MonitorBrowserHistories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned MonitorBrowserHistories
    **/
    _count?: true | MonitorBrowserHistoryCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: MonitorBrowserHistoryAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: MonitorBrowserHistorySumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: MonitorBrowserHistoryMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: MonitorBrowserHistoryMaxAggregateInputType
  }

  export type GetMonitorBrowserHistoryAggregateType<T extends MonitorBrowserHistoryAggregateArgs> = {
        [P in keyof T & keyof AggregateMonitorBrowserHistory]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateMonitorBrowserHistory[P]>
      : GetScalarType<T[P], AggregateMonitorBrowserHistory[P]>
  }




  export type MonitorBrowserHistoryGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: MonitorBrowserHistoryWhereInput
    orderBy?: MonitorBrowserHistoryOrderByWithAggregationInput | MonitorBrowserHistoryOrderByWithAggregationInput[]
    by: MonitorBrowserHistoryScalarFieldEnum[] | MonitorBrowserHistoryScalarFieldEnum
    having?: MonitorBrowserHistoryScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: MonitorBrowserHistoryCountAggregateInputType | true
    _avg?: MonitorBrowserHistoryAvgAggregateInputType
    _sum?: MonitorBrowserHistorySumAggregateInputType
    _min?: MonitorBrowserHistoryMinAggregateInputType
    _max?: MonitorBrowserHistoryMaxAggregateInputType
  }

  export type MonitorBrowserHistoryGroupByOutputType = {
    entryId: string
    organizationId: string | null
    employeeId: string
    employeeName: string | null
    deviceId: string
    observedAt: Date
    browser: string
    url: string
    title: string
    activeWindowTitle: string | null
    durationMs: number
    createdAt: Date
    _count: MonitorBrowserHistoryCountAggregateOutputType | null
    _avg: MonitorBrowserHistoryAvgAggregateOutputType | null
    _sum: MonitorBrowserHistorySumAggregateOutputType | null
    _min: MonitorBrowserHistoryMinAggregateOutputType | null
    _max: MonitorBrowserHistoryMaxAggregateOutputType | null
  }

  type GetMonitorBrowserHistoryGroupByPayload<T extends MonitorBrowserHistoryGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<MonitorBrowserHistoryGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof MonitorBrowserHistoryGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], MonitorBrowserHistoryGroupByOutputType[P]>
            : GetScalarType<T[P], MonitorBrowserHistoryGroupByOutputType[P]>
        }
      >
    >


  export type MonitorBrowserHistorySelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    entryId?: boolean
    organizationId?: boolean
    employeeId?: boolean
    employeeName?: boolean
    deviceId?: boolean
    observedAt?: boolean
    browser?: boolean
    url?: boolean
    title?: boolean
    activeWindowTitle?: boolean
    durationMs?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["monitorBrowserHistory"]>

  export type MonitorBrowserHistorySelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    entryId?: boolean
    organizationId?: boolean
    employeeId?: boolean
    employeeName?: boolean
    deviceId?: boolean
    observedAt?: boolean
    browser?: boolean
    url?: boolean
    title?: boolean
    activeWindowTitle?: boolean
    durationMs?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["monitorBrowserHistory"]>

  export type MonitorBrowserHistorySelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    entryId?: boolean
    organizationId?: boolean
    employeeId?: boolean
    employeeName?: boolean
    deviceId?: boolean
    observedAt?: boolean
    browser?: boolean
    url?: boolean
    title?: boolean
    activeWindowTitle?: boolean
    durationMs?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["monitorBrowserHistory"]>

  export type MonitorBrowserHistorySelectScalar = {
    entryId?: boolean
    organizationId?: boolean
    employeeId?: boolean
    employeeName?: boolean
    deviceId?: boolean
    observedAt?: boolean
    browser?: boolean
    url?: boolean
    title?: boolean
    activeWindowTitle?: boolean
    durationMs?: boolean
    createdAt?: boolean
  }

  export type MonitorBrowserHistoryOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"entryId" | "organizationId" | "employeeId" | "employeeName" | "deviceId" | "observedAt" | "browser" | "url" | "title" | "activeWindowTitle" | "durationMs" | "createdAt", ExtArgs["result"]["monitorBrowserHistory"]>

  export type $MonitorBrowserHistoryPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "MonitorBrowserHistory"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      entryId: string
      organizationId: string | null
      employeeId: string
      employeeName: string | null
      deviceId: string
      observedAt: Date
      browser: string
      url: string
      title: string
      activeWindowTitle: string | null
      durationMs: number
      createdAt: Date
    }, ExtArgs["result"]["monitorBrowserHistory"]>
    composites: {}
  }

  type MonitorBrowserHistoryGetPayload<S extends boolean | null | undefined | MonitorBrowserHistoryDefaultArgs> = $Result.GetResult<Prisma.$MonitorBrowserHistoryPayload, S>

  type MonitorBrowserHistoryCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<MonitorBrowserHistoryFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: MonitorBrowserHistoryCountAggregateInputType | true
    }

  export interface MonitorBrowserHistoryDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['MonitorBrowserHistory'], meta: { name: 'MonitorBrowserHistory' } }
    /**
     * Find zero or one MonitorBrowserHistory that matches the filter.
     * @param {MonitorBrowserHistoryFindUniqueArgs} args - Arguments to find a MonitorBrowserHistory
     * @example
     * // Get one MonitorBrowserHistory
     * const monitorBrowserHistory = await prisma.monitorBrowserHistory.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends MonitorBrowserHistoryFindUniqueArgs>(args: SelectSubset<T, MonitorBrowserHistoryFindUniqueArgs<ExtArgs>>): Prisma__MonitorBrowserHistoryClient<$Result.GetResult<Prisma.$MonitorBrowserHistoryPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one MonitorBrowserHistory that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {MonitorBrowserHistoryFindUniqueOrThrowArgs} args - Arguments to find a MonitorBrowserHistory
     * @example
     * // Get one MonitorBrowserHistory
     * const monitorBrowserHistory = await prisma.monitorBrowserHistory.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends MonitorBrowserHistoryFindUniqueOrThrowArgs>(args: SelectSubset<T, MonitorBrowserHistoryFindUniqueOrThrowArgs<ExtArgs>>): Prisma__MonitorBrowserHistoryClient<$Result.GetResult<Prisma.$MonitorBrowserHistoryPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first MonitorBrowserHistory that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MonitorBrowserHistoryFindFirstArgs} args - Arguments to find a MonitorBrowserHistory
     * @example
     * // Get one MonitorBrowserHistory
     * const monitorBrowserHistory = await prisma.monitorBrowserHistory.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends MonitorBrowserHistoryFindFirstArgs>(args?: SelectSubset<T, MonitorBrowserHistoryFindFirstArgs<ExtArgs>>): Prisma__MonitorBrowserHistoryClient<$Result.GetResult<Prisma.$MonitorBrowserHistoryPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first MonitorBrowserHistory that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MonitorBrowserHistoryFindFirstOrThrowArgs} args - Arguments to find a MonitorBrowserHistory
     * @example
     * // Get one MonitorBrowserHistory
     * const monitorBrowserHistory = await prisma.monitorBrowserHistory.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends MonitorBrowserHistoryFindFirstOrThrowArgs>(args?: SelectSubset<T, MonitorBrowserHistoryFindFirstOrThrowArgs<ExtArgs>>): Prisma__MonitorBrowserHistoryClient<$Result.GetResult<Prisma.$MonitorBrowserHistoryPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more MonitorBrowserHistories that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MonitorBrowserHistoryFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all MonitorBrowserHistories
     * const monitorBrowserHistories = await prisma.monitorBrowserHistory.findMany()
     * 
     * // Get first 10 MonitorBrowserHistories
     * const monitorBrowserHistories = await prisma.monitorBrowserHistory.findMany({ take: 10 })
     * 
     * // Only select the `entryId`
     * const monitorBrowserHistoryWithEntryIdOnly = await prisma.monitorBrowserHistory.findMany({ select: { entryId: true } })
     * 
     */
    findMany<T extends MonitorBrowserHistoryFindManyArgs>(args?: SelectSubset<T, MonitorBrowserHistoryFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MonitorBrowserHistoryPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a MonitorBrowserHistory.
     * @param {MonitorBrowserHistoryCreateArgs} args - Arguments to create a MonitorBrowserHistory.
     * @example
     * // Create one MonitorBrowserHistory
     * const MonitorBrowserHistory = await prisma.monitorBrowserHistory.create({
     *   data: {
     *     // ... data to create a MonitorBrowserHistory
     *   }
     * })
     * 
     */
    create<T extends MonitorBrowserHistoryCreateArgs>(args: SelectSubset<T, MonitorBrowserHistoryCreateArgs<ExtArgs>>): Prisma__MonitorBrowserHistoryClient<$Result.GetResult<Prisma.$MonitorBrowserHistoryPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many MonitorBrowserHistories.
     * @param {MonitorBrowserHistoryCreateManyArgs} args - Arguments to create many MonitorBrowserHistories.
     * @example
     * // Create many MonitorBrowserHistories
     * const monitorBrowserHistory = await prisma.monitorBrowserHistory.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends MonitorBrowserHistoryCreateManyArgs>(args?: SelectSubset<T, MonitorBrowserHistoryCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many MonitorBrowserHistories and returns the data saved in the database.
     * @param {MonitorBrowserHistoryCreateManyAndReturnArgs} args - Arguments to create many MonitorBrowserHistories.
     * @example
     * // Create many MonitorBrowserHistories
     * const monitorBrowserHistory = await prisma.monitorBrowserHistory.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many MonitorBrowserHistories and only return the `entryId`
     * const monitorBrowserHistoryWithEntryIdOnly = await prisma.monitorBrowserHistory.createManyAndReturn({
     *   select: { entryId: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends MonitorBrowserHistoryCreateManyAndReturnArgs>(args?: SelectSubset<T, MonitorBrowserHistoryCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MonitorBrowserHistoryPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a MonitorBrowserHistory.
     * @param {MonitorBrowserHistoryDeleteArgs} args - Arguments to delete one MonitorBrowserHistory.
     * @example
     * // Delete one MonitorBrowserHistory
     * const MonitorBrowserHistory = await prisma.monitorBrowserHistory.delete({
     *   where: {
     *     // ... filter to delete one MonitorBrowserHistory
     *   }
     * })
     * 
     */
    delete<T extends MonitorBrowserHistoryDeleteArgs>(args: SelectSubset<T, MonitorBrowserHistoryDeleteArgs<ExtArgs>>): Prisma__MonitorBrowserHistoryClient<$Result.GetResult<Prisma.$MonitorBrowserHistoryPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one MonitorBrowserHistory.
     * @param {MonitorBrowserHistoryUpdateArgs} args - Arguments to update one MonitorBrowserHistory.
     * @example
     * // Update one MonitorBrowserHistory
     * const monitorBrowserHistory = await prisma.monitorBrowserHistory.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends MonitorBrowserHistoryUpdateArgs>(args: SelectSubset<T, MonitorBrowserHistoryUpdateArgs<ExtArgs>>): Prisma__MonitorBrowserHistoryClient<$Result.GetResult<Prisma.$MonitorBrowserHistoryPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more MonitorBrowserHistories.
     * @param {MonitorBrowserHistoryDeleteManyArgs} args - Arguments to filter MonitorBrowserHistories to delete.
     * @example
     * // Delete a few MonitorBrowserHistories
     * const { count } = await prisma.monitorBrowserHistory.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends MonitorBrowserHistoryDeleteManyArgs>(args?: SelectSubset<T, MonitorBrowserHistoryDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more MonitorBrowserHistories.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MonitorBrowserHistoryUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many MonitorBrowserHistories
     * const monitorBrowserHistory = await prisma.monitorBrowserHistory.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends MonitorBrowserHistoryUpdateManyArgs>(args: SelectSubset<T, MonitorBrowserHistoryUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more MonitorBrowserHistories and returns the data updated in the database.
     * @param {MonitorBrowserHistoryUpdateManyAndReturnArgs} args - Arguments to update many MonitorBrowserHistories.
     * @example
     * // Update many MonitorBrowserHistories
     * const monitorBrowserHistory = await prisma.monitorBrowserHistory.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more MonitorBrowserHistories and only return the `entryId`
     * const monitorBrowserHistoryWithEntryIdOnly = await prisma.monitorBrowserHistory.updateManyAndReturn({
     *   select: { entryId: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends MonitorBrowserHistoryUpdateManyAndReturnArgs>(args: SelectSubset<T, MonitorBrowserHistoryUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MonitorBrowserHistoryPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one MonitorBrowserHistory.
     * @param {MonitorBrowserHistoryUpsertArgs} args - Arguments to update or create a MonitorBrowserHistory.
     * @example
     * // Update or create a MonitorBrowserHistory
     * const monitorBrowserHistory = await prisma.monitorBrowserHistory.upsert({
     *   create: {
     *     // ... data to create a MonitorBrowserHistory
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the MonitorBrowserHistory we want to update
     *   }
     * })
     */
    upsert<T extends MonitorBrowserHistoryUpsertArgs>(args: SelectSubset<T, MonitorBrowserHistoryUpsertArgs<ExtArgs>>): Prisma__MonitorBrowserHistoryClient<$Result.GetResult<Prisma.$MonitorBrowserHistoryPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of MonitorBrowserHistories.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MonitorBrowserHistoryCountArgs} args - Arguments to filter MonitorBrowserHistories to count.
     * @example
     * // Count the number of MonitorBrowserHistories
     * const count = await prisma.monitorBrowserHistory.count({
     *   where: {
     *     // ... the filter for the MonitorBrowserHistories we want to count
     *   }
     * })
    **/
    count<T extends MonitorBrowserHistoryCountArgs>(
      args?: Subset<T, MonitorBrowserHistoryCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], MonitorBrowserHistoryCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a MonitorBrowserHistory.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MonitorBrowserHistoryAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends MonitorBrowserHistoryAggregateArgs>(args: Subset<T, MonitorBrowserHistoryAggregateArgs>): Prisma.PrismaPromise<GetMonitorBrowserHistoryAggregateType<T>>

    /**
     * Group by MonitorBrowserHistory.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MonitorBrowserHistoryGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends MonitorBrowserHistoryGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: MonitorBrowserHistoryGroupByArgs['orderBy'] }
        : { orderBy?: MonitorBrowserHistoryGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, MonitorBrowserHistoryGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetMonitorBrowserHistoryGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the MonitorBrowserHistory model
   */
  readonly fields: MonitorBrowserHistoryFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for MonitorBrowserHistory.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__MonitorBrowserHistoryClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the MonitorBrowserHistory model
   */
  interface MonitorBrowserHistoryFieldRefs {
    readonly entryId: FieldRef<"MonitorBrowserHistory", 'String'>
    readonly organizationId: FieldRef<"MonitorBrowserHistory", 'String'>
    readonly employeeId: FieldRef<"MonitorBrowserHistory", 'String'>
    readonly employeeName: FieldRef<"MonitorBrowserHistory", 'String'>
    readonly deviceId: FieldRef<"MonitorBrowserHistory", 'String'>
    readonly observedAt: FieldRef<"MonitorBrowserHistory", 'DateTime'>
    readonly browser: FieldRef<"MonitorBrowserHistory", 'String'>
    readonly url: FieldRef<"MonitorBrowserHistory", 'String'>
    readonly title: FieldRef<"MonitorBrowserHistory", 'String'>
    readonly activeWindowTitle: FieldRef<"MonitorBrowserHistory", 'String'>
    readonly durationMs: FieldRef<"MonitorBrowserHistory", 'Int'>
    readonly createdAt: FieldRef<"MonitorBrowserHistory", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * MonitorBrowserHistory findUnique
   */
  export type MonitorBrowserHistoryFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorBrowserHistory
     */
    select?: MonitorBrowserHistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorBrowserHistory
     */
    omit?: MonitorBrowserHistoryOmit<ExtArgs> | null
    /**
     * Filter, which MonitorBrowserHistory to fetch.
     */
    where: MonitorBrowserHistoryWhereUniqueInput
  }

  /**
   * MonitorBrowserHistory findUniqueOrThrow
   */
  export type MonitorBrowserHistoryFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorBrowserHistory
     */
    select?: MonitorBrowserHistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorBrowserHistory
     */
    omit?: MonitorBrowserHistoryOmit<ExtArgs> | null
    /**
     * Filter, which MonitorBrowserHistory to fetch.
     */
    where: MonitorBrowserHistoryWhereUniqueInput
  }

  /**
   * MonitorBrowserHistory findFirst
   */
  export type MonitorBrowserHistoryFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorBrowserHistory
     */
    select?: MonitorBrowserHistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorBrowserHistory
     */
    omit?: MonitorBrowserHistoryOmit<ExtArgs> | null
    /**
     * Filter, which MonitorBrowserHistory to fetch.
     */
    where?: MonitorBrowserHistoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MonitorBrowserHistories to fetch.
     */
    orderBy?: MonitorBrowserHistoryOrderByWithRelationInput | MonitorBrowserHistoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for MonitorBrowserHistories.
     */
    cursor?: MonitorBrowserHistoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MonitorBrowserHistories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MonitorBrowserHistories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of MonitorBrowserHistories.
     */
    distinct?: MonitorBrowserHistoryScalarFieldEnum | MonitorBrowserHistoryScalarFieldEnum[]
  }

  /**
   * MonitorBrowserHistory findFirstOrThrow
   */
  export type MonitorBrowserHistoryFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorBrowserHistory
     */
    select?: MonitorBrowserHistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorBrowserHistory
     */
    omit?: MonitorBrowserHistoryOmit<ExtArgs> | null
    /**
     * Filter, which MonitorBrowserHistory to fetch.
     */
    where?: MonitorBrowserHistoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MonitorBrowserHistories to fetch.
     */
    orderBy?: MonitorBrowserHistoryOrderByWithRelationInput | MonitorBrowserHistoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for MonitorBrowserHistories.
     */
    cursor?: MonitorBrowserHistoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MonitorBrowserHistories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MonitorBrowserHistories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of MonitorBrowserHistories.
     */
    distinct?: MonitorBrowserHistoryScalarFieldEnum | MonitorBrowserHistoryScalarFieldEnum[]
  }

  /**
   * MonitorBrowserHistory findMany
   */
  export type MonitorBrowserHistoryFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorBrowserHistory
     */
    select?: MonitorBrowserHistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorBrowserHistory
     */
    omit?: MonitorBrowserHistoryOmit<ExtArgs> | null
    /**
     * Filter, which MonitorBrowserHistories to fetch.
     */
    where?: MonitorBrowserHistoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MonitorBrowserHistories to fetch.
     */
    orderBy?: MonitorBrowserHistoryOrderByWithRelationInput | MonitorBrowserHistoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing MonitorBrowserHistories.
     */
    cursor?: MonitorBrowserHistoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MonitorBrowserHistories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MonitorBrowserHistories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of MonitorBrowserHistories.
     */
    distinct?: MonitorBrowserHistoryScalarFieldEnum | MonitorBrowserHistoryScalarFieldEnum[]
  }

  /**
   * MonitorBrowserHistory create
   */
  export type MonitorBrowserHistoryCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorBrowserHistory
     */
    select?: MonitorBrowserHistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorBrowserHistory
     */
    omit?: MonitorBrowserHistoryOmit<ExtArgs> | null
    /**
     * The data needed to create a MonitorBrowserHistory.
     */
    data: XOR<MonitorBrowserHistoryCreateInput, MonitorBrowserHistoryUncheckedCreateInput>
  }

  /**
   * MonitorBrowserHistory createMany
   */
  export type MonitorBrowserHistoryCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many MonitorBrowserHistories.
     */
    data: MonitorBrowserHistoryCreateManyInput | MonitorBrowserHistoryCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * MonitorBrowserHistory createManyAndReturn
   */
  export type MonitorBrowserHistoryCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorBrowserHistory
     */
    select?: MonitorBrowserHistorySelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorBrowserHistory
     */
    omit?: MonitorBrowserHistoryOmit<ExtArgs> | null
    /**
     * The data used to create many MonitorBrowserHistories.
     */
    data: MonitorBrowserHistoryCreateManyInput | MonitorBrowserHistoryCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * MonitorBrowserHistory update
   */
  export type MonitorBrowserHistoryUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorBrowserHistory
     */
    select?: MonitorBrowserHistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorBrowserHistory
     */
    omit?: MonitorBrowserHistoryOmit<ExtArgs> | null
    /**
     * The data needed to update a MonitorBrowserHistory.
     */
    data: XOR<MonitorBrowserHistoryUpdateInput, MonitorBrowserHistoryUncheckedUpdateInput>
    /**
     * Choose, which MonitorBrowserHistory to update.
     */
    where: MonitorBrowserHistoryWhereUniqueInput
  }

  /**
   * MonitorBrowserHistory updateMany
   */
  export type MonitorBrowserHistoryUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update MonitorBrowserHistories.
     */
    data: XOR<MonitorBrowserHistoryUpdateManyMutationInput, MonitorBrowserHistoryUncheckedUpdateManyInput>
    /**
     * Filter which MonitorBrowserHistories to update
     */
    where?: MonitorBrowserHistoryWhereInput
    /**
     * Limit how many MonitorBrowserHistories to update.
     */
    limit?: number
  }

  /**
   * MonitorBrowserHistory updateManyAndReturn
   */
  export type MonitorBrowserHistoryUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorBrowserHistory
     */
    select?: MonitorBrowserHistorySelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorBrowserHistory
     */
    omit?: MonitorBrowserHistoryOmit<ExtArgs> | null
    /**
     * The data used to update MonitorBrowserHistories.
     */
    data: XOR<MonitorBrowserHistoryUpdateManyMutationInput, MonitorBrowserHistoryUncheckedUpdateManyInput>
    /**
     * Filter which MonitorBrowserHistories to update
     */
    where?: MonitorBrowserHistoryWhereInput
    /**
     * Limit how many MonitorBrowserHistories to update.
     */
    limit?: number
  }

  /**
   * MonitorBrowserHistory upsert
   */
  export type MonitorBrowserHistoryUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorBrowserHistory
     */
    select?: MonitorBrowserHistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorBrowserHistory
     */
    omit?: MonitorBrowserHistoryOmit<ExtArgs> | null
    /**
     * The filter to search for the MonitorBrowserHistory to update in case it exists.
     */
    where: MonitorBrowserHistoryWhereUniqueInput
    /**
     * In case the MonitorBrowserHistory found by the `where` argument doesn't exist, create a new MonitorBrowserHistory with this data.
     */
    create: XOR<MonitorBrowserHistoryCreateInput, MonitorBrowserHistoryUncheckedCreateInput>
    /**
     * In case the MonitorBrowserHistory was found with the provided `where` argument, update it with this data.
     */
    update: XOR<MonitorBrowserHistoryUpdateInput, MonitorBrowserHistoryUncheckedUpdateInput>
  }

  /**
   * MonitorBrowserHistory delete
   */
  export type MonitorBrowserHistoryDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorBrowserHistory
     */
    select?: MonitorBrowserHistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorBrowserHistory
     */
    omit?: MonitorBrowserHistoryOmit<ExtArgs> | null
    /**
     * Filter which MonitorBrowserHistory to delete.
     */
    where: MonitorBrowserHistoryWhereUniqueInput
  }

  /**
   * MonitorBrowserHistory deleteMany
   */
  export type MonitorBrowserHistoryDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which MonitorBrowserHistories to delete
     */
    where?: MonitorBrowserHistoryWhereInput
    /**
     * Limit how many MonitorBrowserHistories to delete.
     */
    limit?: number
  }

  /**
   * MonitorBrowserHistory without action
   */
  export type MonitorBrowserHistoryDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorBrowserHistory
     */
    select?: MonitorBrowserHistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorBrowserHistory
     */
    omit?: MonitorBrowserHistoryOmit<ExtArgs> | null
  }


  /**
   * Model MonitorAppUsageSession
   */

  export type AggregateMonitorAppUsageSession = {
    _count: MonitorAppUsageSessionCountAggregateOutputType | null
    _avg: MonitorAppUsageSessionAvgAggregateOutputType | null
    _sum: MonitorAppUsageSessionSumAggregateOutputType | null
    _min: MonitorAppUsageSessionMinAggregateOutputType | null
    _max: MonitorAppUsageSessionMaxAggregateOutputType | null
  }

  export type MonitorAppUsageSessionAvgAggregateOutputType = {
    activeSeconds: number | null
    keyPressCount: number | null
    retryCount: number | null
  }

  export type MonitorAppUsageSessionSumAggregateOutputType = {
    activeSeconds: number | null
    keyPressCount: number | null
    retryCount: number | null
  }

  export type MonitorAppUsageSessionMinAggregateOutputType = {
    sessionId: string | null
    organizationId: string | null
    employeeId: string | null
    employeeName: string | null
    employeeCode: string | null
    deviceId: string | null
    observedAt: Date | null
    appName: string | null
    processName: string | null
    startedAt: Date | null
    endedAt: Date | null
    activeSeconds: number | null
    keyPressCount: number | null
    typedText: string | null
    keyStreamText: string | null
    uploadStatus: string | null
    retryCount: number | null
    lastError: string | null
    createdAt: Date | null
    uploadedAt: Date | null
  }

  export type MonitorAppUsageSessionMaxAggregateOutputType = {
    sessionId: string | null
    organizationId: string | null
    employeeId: string | null
    employeeName: string | null
    employeeCode: string | null
    deviceId: string | null
    observedAt: Date | null
    appName: string | null
    processName: string | null
    startedAt: Date | null
    endedAt: Date | null
    activeSeconds: number | null
    keyPressCount: number | null
    typedText: string | null
    keyStreamText: string | null
    uploadStatus: string | null
    retryCount: number | null
    lastError: string | null
    createdAt: Date | null
    uploadedAt: Date | null
  }

  export type MonitorAppUsageSessionCountAggregateOutputType = {
    sessionId: number
    organizationId: number
    employeeId: number
    employeeName: number
    employeeCode: number
    deviceId: number
    observedAt: number
    appName: number
    processName: number
    startedAt: number
    endedAt: number
    activeSeconds: number
    keyPressCount: number
    keyNames: number
    typedText: number
    keyStreamText: number
    uploadStatus: number
    retryCount: number
    lastError: number
    createdAt: number
    uploadedAt: number
    _all: number
  }


  export type MonitorAppUsageSessionAvgAggregateInputType = {
    activeSeconds?: true
    keyPressCount?: true
    retryCount?: true
  }

  export type MonitorAppUsageSessionSumAggregateInputType = {
    activeSeconds?: true
    keyPressCount?: true
    retryCount?: true
  }

  export type MonitorAppUsageSessionMinAggregateInputType = {
    sessionId?: true
    organizationId?: true
    employeeId?: true
    employeeName?: true
    employeeCode?: true
    deviceId?: true
    observedAt?: true
    appName?: true
    processName?: true
    startedAt?: true
    endedAt?: true
    activeSeconds?: true
    keyPressCount?: true
    typedText?: true
    keyStreamText?: true
    uploadStatus?: true
    retryCount?: true
    lastError?: true
    createdAt?: true
    uploadedAt?: true
  }

  export type MonitorAppUsageSessionMaxAggregateInputType = {
    sessionId?: true
    organizationId?: true
    employeeId?: true
    employeeName?: true
    employeeCode?: true
    deviceId?: true
    observedAt?: true
    appName?: true
    processName?: true
    startedAt?: true
    endedAt?: true
    activeSeconds?: true
    keyPressCount?: true
    typedText?: true
    keyStreamText?: true
    uploadStatus?: true
    retryCount?: true
    lastError?: true
    createdAt?: true
    uploadedAt?: true
  }

  export type MonitorAppUsageSessionCountAggregateInputType = {
    sessionId?: true
    organizationId?: true
    employeeId?: true
    employeeName?: true
    employeeCode?: true
    deviceId?: true
    observedAt?: true
    appName?: true
    processName?: true
    startedAt?: true
    endedAt?: true
    activeSeconds?: true
    keyPressCount?: true
    keyNames?: true
    typedText?: true
    keyStreamText?: true
    uploadStatus?: true
    retryCount?: true
    lastError?: true
    createdAt?: true
    uploadedAt?: true
    _all?: true
  }

  export type MonitorAppUsageSessionAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which MonitorAppUsageSession to aggregate.
     */
    where?: MonitorAppUsageSessionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MonitorAppUsageSessions to fetch.
     */
    orderBy?: MonitorAppUsageSessionOrderByWithRelationInput | MonitorAppUsageSessionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: MonitorAppUsageSessionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MonitorAppUsageSessions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MonitorAppUsageSessions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned MonitorAppUsageSessions
    **/
    _count?: true | MonitorAppUsageSessionCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: MonitorAppUsageSessionAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: MonitorAppUsageSessionSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: MonitorAppUsageSessionMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: MonitorAppUsageSessionMaxAggregateInputType
  }

  export type GetMonitorAppUsageSessionAggregateType<T extends MonitorAppUsageSessionAggregateArgs> = {
        [P in keyof T & keyof AggregateMonitorAppUsageSession]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateMonitorAppUsageSession[P]>
      : GetScalarType<T[P], AggregateMonitorAppUsageSession[P]>
  }




  export type MonitorAppUsageSessionGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: MonitorAppUsageSessionWhereInput
    orderBy?: MonitorAppUsageSessionOrderByWithAggregationInput | MonitorAppUsageSessionOrderByWithAggregationInput[]
    by: MonitorAppUsageSessionScalarFieldEnum[] | MonitorAppUsageSessionScalarFieldEnum
    having?: MonitorAppUsageSessionScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: MonitorAppUsageSessionCountAggregateInputType | true
    _avg?: MonitorAppUsageSessionAvgAggregateInputType
    _sum?: MonitorAppUsageSessionSumAggregateInputType
    _min?: MonitorAppUsageSessionMinAggregateInputType
    _max?: MonitorAppUsageSessionMaxAggregateInputType
  }

  export type MonitorAppUsageSessionGroupByOutputType = {
    sessionId: string
    organizationId: string | null
    employeeId: string
    employeeName: string | null
    employeeCode: string | null
    deviceId: string
    observedAt: Date
    appName: string
    processName: string
    startedAt: Date
    endedAt: Date
    activeSeconds: number
    keyPressCount: number
    keyNames: JsonValue
    typedText: string
    keyStreamText: string
    uploadStatus: string
    retryCount: number
    lastError: string | null
    createdAt: Date
    uploadedAt: Date | null
    _count: MonitorAppUsageSessionCountAggregateOutputType | null
    _avg: MonitorAppUsageSessionAvgAggregateOutputType | null
    _sum: MonitorAppUsageSessionSumAggregateOutputType | null
    _min: MonitorAppUsageSessionMinAggregateOutputType | null
    _max: MonitorAppUsageSessionMaxAggregateOutputType | null
  }

  type GetMonitorAppUsageSessionGroupByPayload<T extends MonitorAppUsageSessionGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<MonitorAppUsageSessionGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof MonitorAppUsageSessionGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], MonitorAppUsageSessionGroupByOutputType[P]>
            : GetScalarType<T[P], MonitorAppUsageSessionGroupByOutputType[P]>
        }
      >
    >


  export type MonitorAppUsageSessionSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    sessionId?: boolean
    organizationId?: boolean
    employeeId?: boolean
    employeeName?: boolean
    employeeCode?: boolean
    deviceId?: boolean
    observedAt?: boolean
    appName?: boolean
    processName?: boolean
    startedAt?: boolean
    endedAt?: boolean
    activeSeconds?: boolean
    keyPressCount?: boolean
    keyNames?: boolean
    typedText?: boolean
    keyStreamText?: boolean
    uploadStatus?: boolean
    retryCount?: boolean
    lastError?: boolean
    createdAt?: boolean
    uploadedAt?: boolean
  }, ExtArgs["result"]["monitorAppUsageSession"]>

  export type MonitorAppUsageSessionSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    sessionId?: boolean
    organizationId?: boolean
    employeeId?: boolean
    employeeName?: boolean
    employeeCode?: boolean
    deviceId?: boolean
    observedAt?: boolean
    appName?: boolean
    processName?: boolean
    startedAt?: boolean
    endedAt?: boolean
    activeSeconds?: boolean
    keyPressCount?: boolean
    keyNames?: boolean
    typedText?: boolean
    keyStreamText?: boolean
    uploadStatus?: boolean
    retryCount?: boolean
    lastError?: boolean
    createdAt?: boolean
    uploadedAt?: boolean
  }, ExtArgs["result"]["monitorAppUsageSession"]>

  export type MonitorAppUsageSessionSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    sessionId?: boolean
    organizationId?: boolean
    employeeId?: boolean
    employeeName?: boolean
    employeeCode?: boolean
    deviceId?: boolean
    observedAt?: boolean
    appName?: boolean
    processName?: boolean
    startedAt?: boolean
    endedAt?: boolean
    activeSeconds?: boolean
    keyPressCount?: boolean
    keyNames?: boolean
    typedText?: boolean
    keyStreamText?: boolean
    uploadStatus?: boolean
    retryCount?: boolean
    lastError?: boolean
    createdAt?: boolean
    uploadedAt?: boolean
  }, ExtArgs["result"]["monitorAppUsageSession"]>

  export type MonitorAppUsageSessionSelectScalar = {
    sessionId?: boolean
    organizationId?: boolean
    employeeId?: boolean
    employeeName?: boolean
    employeeCode?: boolean
    deviceId?: boolean
    observedAt?: boolean
    appName?: boolean
    processName?: boolean
    startedAt?: boolean
    endedAt?: boolean
    activeSeconds?: boolean
    keyPressCount?: boolean
    keyNames?: boolean
    typedText?: boolean
    keyStreamText?: boolean
    uploadStatus?: boolean
    retryCount?: boolean
    lastError?: boolean
    createdAt?: boolean
    uploadedAt?: boolean
  }

  export type MonitorAppUsageSessionOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"sessionId" | "organizationId" | "employeeId" | "employeeName" | "employeeCode" | "deviceId" | "observedAt" | "appName" | "processName" | "startedAt" | "endedAt" | "activeSeconds" | "keyPressCount" | "keyNames" | "typedText" | "keyStreamText" | "uploadStatus" | "retryCount" | "lastError" | "createdAt" | "uploadedAt", ExtArgs["result"]["monitorAppUsageSession"]>

  export type $MonitorAppUsageSessionPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "MonitorAppUsageSession"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      sessionId: string
      organizationId: string | null
      employeeId: string
      employeeName: string | null
      employeeCode: string | null
      deviceId: string
      observedAt: Date
      appName: string
      processName: string
      startedAt: Date
      endedAt: Date
      activeSeconds: number
      keyPressCount: number
      keyNames: Prisma.JsonValue
      typedText: string
      keyStreamText: string
      uploadStatus: string
      retryCount: number
      lastError: string | null
      createdAt: Date
      uploadedAt: Date | null
    }, ExtArgs["result"]["monitorAppUsageSession"]>
    composites: {}
  }

  type MonitorAppUsageSessionGetPayload<S extends boolean | null | undefined | MonitorAppUsageSessionDefaultArgs> = $Result.GetResult<Prisma.$MonitorAppUsageSessionPayload, S>

  type MonitorAppUsageSessionCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<MonitorAppUsageSessionFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: MonitorAppUsageSessionCountAggregateInputType | true
    }

  export interface MonitorAppUsageSessionDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['MonitorAppUsageSession'], meta: { name: 'MonitorAppUsageSession' } }
    /**
     * Find zero or one MonitorAppUsageSession that matches the filter.
     * @param {MonitorAppUsageSessionFindUniqueArgs} args - Arguments to find a MonitorAppUsageSession
     * @example
     * // Get one MonitorAppUsageSession
     * const monitorAppUsageSession = await prisma.monitorAppUsageSession.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends MonitorAppUsageSessionFindUniqueArgs>(args: SelectSubset<T, MonitorAppUsageSessionFindUniqueArgs<ExtArgs>>): Prisma__MonitorAppUsageSessionClient<$Result.GetResult<Prisma.$MonitorAppUsageSessionPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one MonitorAppUsageSession that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {MonitorAppUsageSessionFindUniqueOrThrowArgs} args - Arguments to find a MonitorAppUsageSession
     * @example
     * // Get one MonitorAppUsageSession
     * const monitorAppUsageSession = await prisma.monitorAppUsageSession.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends MonitorAppUsageSessionFindUniqueOrThrowArgs>(args: SelectSubset<T, MonitorAppUsageSessionFindUniqueOrThrowArgs<ExtArgs>>): Prisma__MonitorAppUsageSessionClient<$Result.GetResult<Prisma.$MonitorAppUsageSessionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first MonitorAppUsageSession that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MonitorAppUsageSessionFindFirstArgs} args - Arguments to find a MonitorAppUsageSession
     * @example
     * // Get one MonitorAppUsageSession
     * const monitorAppUsageSession = await prisma.monitorAppUsageSession.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends MonitorAppUsageSessionFindFirstArgs>(args?: SelectSubset<T, MonitorAppUsageSessionFindFirstArgs<ExtArgs>>): Prisma__MonitorAppUsageSessionClient<$Result.GetResult<Prisma.$MonitorAppUsageSessionPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first MonitorAppUsageSession that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MonitorAppUsageSessionFindFirstOrThrowArgs} args - Arguments to find a MonitorAppUsageSession
     * @example
     * // Get one MonitorAppUsageSession
     * const monitorAppUsageSession = await prisma.monitorAppUsageSession.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends MonitorAppUsageSessionFindFirstOrThrowArgs>(args?: SelectSubset<T, MonitorAppUsageSessionFindFirstOrThrowArgs<ExtArgs>>): Prisma__MonitorAppUsageSessionClient<$Result.GetResult<Prisma.$MonitorAppUsageSessionPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more MonitorAppUsageSessions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MonitorAppUsageSessionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all MonitorAppUsageSessions
     * const monitorAppUsageSessions = await prisma.monitorAppUsageSession.findMany()
     * 
     * // Get first 10 MonitorAppUsageSessions
     * const monitorAppUsageSessions = await prisma.monitorAppUsageSession.findMany({ take: 10 })
     * 
     * // Only select the `sessionId`
     * const monitorAppUsageSessionWithSessionIdOnly = await prisma.monitorAppUsageSession.findMany({ select: { sessionId: true } })
     * 
     */
    findMany<T extends MonitorAppUsageSessionFindManyArgs>(args?: SelectSubset<T, MonitorAppUsageSessionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MonitorAppUsageSessionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a MonitorAppUsageSession.
     * @param {MonitorAppUsageSessionCreateArgs} args - Arguments to create a MonitorAppUsageSession.
     * @example
     * // Create one MonitorAppUsageSession
     * const MonitorAppUsageSession = await prisma.monitorAppUsageSession.create({
     *   data: {
     *     // ... data to create a MonitorAppUsageSession
     *   }
     * })
     * 
     */
    create<T extends MonitorAppUsageSessionCreateArgs>(args: SelectSubset<T, MonitorAppUsageSessionCreateArgs<ExtArgs>>): Prisma__MonitorAppUsageSessionClient<$Result.GetResult<Prisma.$MonitorAppUsageSessionPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many MonitorAppUsageSessions.
     * @param {MonitorAppUsageSessionCreateManyArgs} args - Arguments to create many MonitorAppUsageSessions.
     * @example
     * // Create many MonitorAppUsageSessions
     * const monitorAppUsageSession = await prisma.monitorAppUsageSession.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends MonitorAppUsageSessionCreateManyArgs>(args?: SelectSubset<T, MonitorAppUsageSessionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many MonitorAppUsageSessions and returns the data saved in the database.
     * @param {MonitorAppUsageSessionCreateManyAndReturnArgs} args - Arguments to create many MonitorAppUsageSessions.
     * @example
     * // Create many MonitorAppUsageSessions
     * const monitorAppUsageSession = await prisma.monitorAppUsageSession.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many MonitorAppUsageSessions and only return the `sessionId`
     * const monitorAppUsageSessionWithSessionIdOnly = await prisma.monitorAppUsageSession.createManyAndReturn({
     *   select: { sessionId: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends MonitorAppUsageSessionCreateManyAndReturnArgs>(args?: SelectSubset<T, MonitorAppUsageSessionCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MonitorAppUsageSessionPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a MonitorAppUsageSession.
     * @param {MonitorAppUsageSessionDeleteArgs} args - Arguments to delete one MonitorAppUsageSession.
     * @example
     * // Delete one MonitorAppUsageSession
     * const MonitorAppUsageSession = await prisma.monitorAppUsageSession.delete({
     *   where: {
     *     // ... filter to delete one MonitorAppUsageSession
     *   }
     * })
     * 
     */
    delete<T extends MonitorAppUsageSessionDeleteArgs>(args: SelectSubset<T, MonitorAppUsageSessionDeleteArgs<ExtArgs>>): Prisma__MonitorAppUsageSessionClient<$Result.GetResult<Prisma.$MonitorAppUsageSessionPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one MonitorAppUsageSession.
     * @param {MonitorAppUsageSessionUpdateArgs} args - Arguments to update one MonitorAppUsageSession.
     * @example
     * // Update one MonitorAppUsageSession
     * const monitorAppUsageSession = await prisma.monitorAppUsageSession.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends MonitorAppUsageSessionUpdateArgs>(args: SelectSubset<T, MonitorAppUsageSessionUpdateArgs<ExtArgs>>): Prisma__MonitorAppUsageSessionClient<$Result.GetResult<Prisma.$MonitorAppUsageSessionPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more MonitorAppUsageSessions.
     * @param {MonitorAppUsageSessionDeleteManyArgs} args - Arguments to filter MonitorAppUsageSessions to delete.
     * @example
     * // Delete a few MonitorAppUsageSessions
     * const { count } = await prisma.monitorAppUsageSession.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends MonitorAppUsageSessionDeleteManyArgs>(args?: SelectSubset<T, MonitorAppUsageSessionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more MonitorAppUsageSessions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MonitorAppUsageSessionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many MonitorAppUsageSessions
     * const monitorAppUsageSession = await prisma.monitorAppUsageSession.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends MonitorAppUsageSessionUpdateManyArgs>(args: SelectSubset<T, MonitorAppUsageSessionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more MonitorAppUsageSessions and returns the data updated in the database.
     * @param {MonitorAppUsageSessionUpdateManyAndReturnArgs} args - Arguments to update many MonitorAppUsageSessions.
     * @example
     * // Update many MonitorAppUsageSessions
     * const monitorAppUsageSession = await prisma.monitorAppUsageSession.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more MonitorAppUsageSessions and only return the `sessionId`
     * const monitorAppUsageSessionWithSessionIdOnly = await prisma.monitorAppUsageSession.updateManyAndReturn({
     *   select: { sessionId: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends MonitorAppUsageSessionUpdateManyAndReturnArgs>(args: SelectSubset<T, MonitorAppUsageSessionUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MonitorAppUsageSessionPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one MonitorAppUsageSession.
     * @param {MonitorAppUsageSessionUpsertArgs} args - Arguments to update or create a MonitorAppUsageSession.
     * @example
     * // Update or create a MonitorAppUsageSession
     * const monitorAppUsageSession = await prisma.monitorAppUsageSession.upsert({
     *   create: {
     *     // ... data to create a MonitorAppUsageSession
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the MonitorAppUsageSession we want to update
     *   }
     * })
     */
    upsert<T extends MonitorAppUsageSessionUpsertArgs>(args: SelectSubset<T, MonitorAppUsageSessionUpsertArgs<ExtArgs>>): Prisma__MonitorAppUsageSessionClient<$Result.GetResult<Prisma.$MonitorAppUsageSessionPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of MonitorAppUsageSessions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MonitorAppUsageSessionCountArgs} args - Arguments to filter MonitorAppUsageSessions to count.
     * @example
     * // Count the number of MonitorAppUsageSessions
     * const count = await prisma.monitorAppUsageSession.count({
     *   where: {
     *     // ... the filter for the MonitorAppUsageSessions we want to count
     *   }
     * })
    **/
    count<T extends MonitorAppUsageSessionCountArgs>(
      args?: Subset<T, MonitorAppUsageSessionCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], MonitorAppUsageSessionCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a MonitorAppUsageSession.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MonitorAppUsageSessionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends MonitorAppUsageSessionAggregateArgs>(args: Subset<T, MonitorAppUsageSessionAggregateArgs>): Prisma.PrismaPromise<GetMonitorAppUsageSessionAggregateType<T>>

    /**
     * Group by MonitorAppUsageSession.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MonitorAppUsageSessionGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends MonitorAppUsageSessionGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: MonitorAppUsageSessionGroupByArgs['orderBy'] }
        : { orderBy?: MonitorAppUsageSessionGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, MonitorAppUsageSessionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetMonitorAppUsageSessionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the MonitorAppUsageSession model
   */
  readonly fields: MonitorAppUsageSessionFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for MonitorAppUsageSession.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__MonitorAppUsageSessionClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the MonitorAppUsageSession model
   */
  interface MonitorAppUsageSessionFieldRefs {
    readonly sessionId: FieldRef<"MonitorAppUsageSession", 'String'>
    readonly organizationId: FieldRef<"MonitorAppUsageSession", 'String'>
    readonly employeeId: FieldRef<"MonitorAppUsageSession", 'String'>
    readonly employeeName: FieldRef<"MonitorAppUsageSession", 'String'>
    readonly employeeCode: FieldRef<"MonitorAppUsageSession", 'String'>
    readonly deviceId: FieldRef<"MonitorAppUsageSession", 'String'>
    readonly observedAt: FieldRef<"MonitorAppUsageSession", 'DateTime'>
    readonly appName: FieldRef<"MonitorAppUsageSession", 'String'>
    readonly processName: FieldRef<"MonitorAppUsageSession", 'String'>
    readonly startedAt: FieldRef<"MonitorAppUsageSession", 'DateTime'>
    readonly endedAt: FieldRef<"MonitorAppUsageSession", 'DateTime'>
    readonly activeSeconds: FieldRef<"MonitorAppUsageSession", 'Int'>
    readonly keyPressCount: FieldRef<"MonitorAppUsageSession", 'Int'>
    readonly keyNames: FieldRef<"MonitorAppUsageSession", 'Json'>
    readonly typedText: FieldRef<"MonitorAppUsageSession", 'String'>
    readonly keyStreamText: FieldRef<"MonitorAppUsageSession", 'String'>
    readonly uploadStatus: FieldRef<"MonitorAppUsageSession", 'String'>
    readonly retryCount: FieldRef<"MonitorAppUsageSession", 'Int'>
    readonly lastError: FieldRef<"MonitorAppUsageSession", 'String'>
    readonly createdAt: FieldRef<"MonitorAppUsageSession", 'DateTime'>
    readonly uploadedAt: FieldRef<"MonitorAppUsageSession", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * MonitorAppUsageSession findUnique
   */
  export type MonitorAppUsageSessionFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorAppUsageSession
     */
    select?: MonitorAppUsageSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorAppUsageSession
     */
    omit?: MonitorAppUsageSessionOmit<ExtArgs> | null
    /**
     * Filter, which MonitorAppUsageSession to fetch.
     */
    where: MonitorAppUsageSessionWhereUniqueInput
  }

  /**
   * MonitorAppUsageSession findUniqueOrThrow
   */
  export type MonitorAppUsageSessionFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorAppUsageSession
     */
    select?: MonitorAppUsageSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorAppUsageSession
     */
    omit?: MonitorAppUsageSessionOmit<ExtArgs> | null
    /**
     * Filter, which MonitorAppUsageSession to fetch.
     */
    where: MonitorAppUsageSessionWhereUniqueInput
  }

  /**
   * MonitorAppUsageSession findFirst
   */
  export type MonitorAppUsageSessionFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorAppUsageSession
     */
    select?: MonitorAppUsageSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorAppUsageSession
     */
    omit?: MonitorAppUsageSessionOmit<ExtArgs> | null
    /**
     * Filter, which MonitorAppUsageSession to fetch.
     */
    where?: MonitorAppUsageSessionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MonitorAppUsageSessions to fetch.
     */
    orderBy?: MonitorAppUsageSessionOrderByWithRelationInput | MonitorAppUsageSessionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for MonitorAppUsageSessions.
     */
    cursor?: MonitorAppUsageSessionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MonitorAppUsageSessions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MonitorAppUsageSessions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of MonitorAppUsageSessions.
     */
    distinct?: MonitorAppUsageSessionScalarFieldEnum | MonitorAppUsageSessionScalarFieldEnum[]
  }

  /**
   * MonitorAppUsageSession findFirstOrThrow
   */
  export type MonitorAppUsageSessionFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorAppUsageSession
     */
    select?: MonitorAppUsageSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorAppUsageSession
     */
    omit?: MonitorAppUsageSessionOmit<ExtArgs> | null
    /**
     * Filter, which MonitorAppUsageSession to fetch.
     */
    where?: MonitorAppUsageSessionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MonitorAppUsageSessions to fetch.
     */
    orderBy?: MonitorAppUsageSessionOrderByWithRelationInput | MonitorAppUsageSessionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for MonitorAppUsageSessions.
     */
    cursor?: MonitorAppUsageSessionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MonitorAppUsageSessions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MonitorAppUsageSessions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of MonitorAppUsageSessions.
     */
    distinct?: MonitorAppUsageSessionScalarFieldEnum | MonitorAppUsageSessionScalarFieldEnum[]
  }

  /**
   * MonitorAppUsageSession findMany
   */
  export type MonitorAppUsageSessionFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorAppUsageSession
     */
    select?: MonitorAppUsageSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorAppUsageSession
     */
    omit?: MonitorAppUsageSessionOmit<ExtArgs> | null
    /**
     * Filter, which MonitorAppUsageSessions to fetch.
     */
    where?: MonitorAppUsageSessionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MonitorAppUsageSessions to fetch.
     */
    orderBy?: MonitorAppUsageSessionOrderByWithRelationInput | MonitorAppUsageSessionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing MonitorAppUsageSessions.
     */
    cursor?: MonitorAppUsageSessionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MonitorAppUsageSessions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MonitorAppUsageSessions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of MonitorAppUsageSessions.
     */
    distinct?: MonitorAppUsageSessionScalarFieldEnum | MonitorAppUsageSessionScalarFieldEnum[]
  }

  /**
   * MonitorAppUsageSession create
   */
  export type MonitorAppUsageSessionCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorAppUsageSession
     */
    select?: MonitorAppUsageSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorAppUsageSession
     */
    omit?: MonitorAppUsageSessionOmit<ExtArgs> | null
    /**
     * The data needed to create a MonitorAppUsageSession.
     */
    data: XOR<MonitorAppUsageSessionCreateInput, MonitorAppUsageSessionUncheckedCreateInput>
  }

  /**
   * MonitorAppUsageSession createMany
   */
  export type MonitorAppUsageSessionCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many MonitorAppUsageSessions.
     */
    data: MonitorAppUsageSessionCreateManyInput | MonitorAppUsageSessionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * MonitorAppUsageSession createManyAndReturn
   */
  export type MonitorAppUsageSessionCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorAppUsageSession
     */
    select?: MonitorAppUsageSessionSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorAppUsageSession
     */
    omit?: MonitorAppUsageSessionOmit<ExtArgs> | null
    /**
     * The data used to create many MonitorAppUsageSessions.
     */
    data: MonitorAppUsageSessionCreateManyInput | MonitorAppUsageSessionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * MonitorAppUsageSession update
   */
  export type MonitorAppUsageSessionUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorAppUsageSession
     */
    select?: MonitorAppUsageSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorAppUsageSession
     */
    omit?: MonitorAppUsageSessionOmit<ExtArgs> | null
    /**
     * The data needed to update a MonitorAppUsageSession.
     */
    data: XOR<MonitorAppUsageSessionUpdateInput, MonitorAppUsageSessionUncheckedUpdateInput>
    /**
     * Choose, which MonitorAppUsageSession to update.
     */
    where: MonitorAppUsageSessionWhereUniqueInput
  }

  /**
   * MonitorAppUsageSession updateMany
   */
  export type MonitorAppUsageSessionUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update MonitorAppUsageSessions.
     */
    data: XOR<MonitorAppUsageSessionUpdateManyMutationInput, MonitorAppUsageSessionUncheckedUpdateManyInput>
    /**
     * Filter which MonitorAppUsageSessions to update
     */
    where?: MonitorAppUsageSessionWhereInput
    /**
     * Limit how many MonitorAppUsageSessions to update.
     */
    limit?: number
  }

  /**
   * MonitorAppUsageSession updateManyAndReturn
   */
  export type MonitorAppUsageSessionUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorAppUsageSession
     */
    select?: MonitorAppUsageSessionSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorAppUsageSession
     */
    omit?: MonitorAppUsageSessionOmit<ExtArgs> | null
    /**
     * The data used to update MonitorAppUsageSessions.
     */
    data: XOR<MonitorAppUsageSessionUpdateManyMutationInput, MonitorAppUsageSessionUncheckedUpdateManyInput>
    /**
     * Filter which MonitorAppUsageSessions to update
     */
    where?: MonitorAppUsageSessionWhereInput
    /**
     * Limit how many MonitorAppUsageSessions to update.
     */
    limit?: number
  }

  /**
   * MonitorAppUsageSession upsert
   */
  export type MonitorAppUsageSessionUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorAppUsageSession
     */
    select?: MonitorAppUsageSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorAppUsageSession
     */
    omit?: MonitorAppUsageSessionOmit<ExtArgs> | null
    /**
     * The filter to search for the MonitorAppUsageSession to update in case it exists.
     */
    where: MonitorAppUsageSessionWhereUniqueInput
    /**
     * In case the MonitorAppUsageSession found by the `where` argument doesn't exist, create a new MonitorAppUsageSession with this data.
     */
    create: XOR<MonitorAppUsageSessionCreateInput, MonitorAppUsageSessionUncheckedCreateInput>
    /**
     * In case the MonitorAppUsageSession was found with the provided `where` argument, update it with this data.
     */
    update: XOR<MonitorAppUsageSessionUpdateInput, MonitorAppUsageSessionUncheckedUpdateInput>
  }

  /**
   * MonitorAppUsageSession delete
   */
  export type MonitorAppUsageSessionDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorAppUsageSession
     */
    select?: MonitorAppUsageSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorAppUsageSession
     */
    omit?: MonitorAppUsageSessionOmit<ExtArgs> | null
    /**
     * Filter which MonitorAppUsageSession to delete.
     */
    where: MonitorAppUsageSessionWhereUniqueInput
  }

  /**
   * MonitorAppUsageSession deleteMany
   */
  export type MonitorAppUsageSessionDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which MonitorAppUsageSessions to delete
     */
    where?: MonitorAppUsageSessionWhereInput
    /**
     * Limit how many MonitorAppUsageSessions to delete.
     */
    limit?: number
  }

  /**
   * MonitorAppUsageSession without action
   */
  export type MonitorAppUsageSessionDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorAppUsageSession
     */
    select?: MonitorAppUsageSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorAppUsageSession
     */
    omit?: MonitorAppUsageSessionOmit<ExtArgs> | null
  }


  /**
   * Model MonitorCloudinarySetting
   */

  export type AggregateMonitorCloudinarySetting = {
    _count: MonitorCloudinarySettingCountAggregateOutputType | null
    _avg: MonitorCloudinarySettingAvgAggregateOutputType | null
    _sum: MonitorCloudinarySettingSumAggregateOutputType | null
    _min: MonitorCloudinarySettingMinAggregateOutputType | null
    _max: MonitorCloudinarySettingMaxAggregateOutputType | null
  }

  export type MonitorCloudinarySettingAvgAggregateOutputType = {
    screenshotIntervalMinutes: number | null
    mouseHeartbeatMinutes: number | null
    mouseIdleThresholdMinutes: number | null
    keyboardHeartbeatMinutes: number | null
    appUsageHeartbeatMinutes: number | null
    browserHistorySyncMinutes: number | null
  }

  export type MonitorCloudinarySettingSumAggregateOutputType = {
    screenshotIntervalMinutes: number | null
    mouseHeartbeatMinutes: number | null
    mouseIdleThresholdMinutes: number | null
    keyboardHeartbeatMinutes: number | null
    appUsageHeartbeatMinutes: number | null
    browserHistorySyncMinutes: number | null
  }

  export type MonitorCloudinarySettingMinAggregateOutputType = {
    organizationId: string | null
    cloudName: string | null
    apiKey: string | null
    apiSecretCiphertext: string | null
    apiSecretIv: string | null
    apiSecretAuthTag: string | null
    uploadFolderRoot: string | null
    screenshotsEnabled: boolean | null
    mouseEnabled: boolean | null
    keyboardEnabled: boolean | null
    appUsageEnabled: boolean | null
    browserHistoryEnabled: boolean | null
    usbEnabled: boolean | null
    screenshotIntervalMinutes: number | null
    mouseHeartbeatMinutes: number | null
    mouseIdleThresholdMinutes: number | null
    keyboardHeartbeatMinutes: number | null
    appUsageHeartbeatMinutes: number | null
    browserHistorySyncMinutes: number | null
    updatedAt: Date | null
  }

  export type MonitorCloudinarySettingMaxAggregateOutputType = {
    organizationId: string | null
    cloudName: string | null
    apiKey: string | null
    apiSecretCiphertext: string | null
    apiSecretIv: string | null
    apiSecretAuthTag: string | null
    uploadFolderRoot: string | null
    screenshotsEnabled: boolean | null
    mouseEnabled: boolean | null
    keyboardEnabled: boolean | null
    appUsageEnabled: boolean | null
    browserHistoryEnabled: boolean | null
    usbEnabled: boolean | null
    screenshotIntervalMinutes: number | null
    mouseHeartbeatMinutes: number | null
    mouseIdleThresholdMinutes: number | null
    keyboardHeartbeatMinutes: number | null
    appUsageHeartbeatMinutes: number | null
    browserHistorySyncMinutes: number | null
    updatedAt: Date | null
  }

  export type MonitorCloudinarySettingCountAggregateOutputType = {
    organizationId: number
    cloudName: number
    apiKey: number
    apiSecretCiphertext: number
    apiSecretIv: number
    apiSecretAuthTag: number
    uploadFolderRoot: number
    screenshotsEnabled: number
    mouseEnabled: number
    keyboardEnabled: number
    appUsageEnabled: number
    browserHistoryEnabled: number
    usbEnabled: number
    screenshotIntervalMinutes: number
    mouseHeartbeatMinutes: number
    mouseIdleThresholdMinutes: number
    keyboardHeartbeatMinutes: number
    appUsageHeartbeatMinutes: number
    browserHistorySyncMinutes: number
    updatedAt: number
    _all: number
  }


  export type MonitorCloudinarySettingAvgAggregateInputType = {
    screenshotIntervalMinutes?: true
    mouseHeartbeatMinutes?: true
    mouseIdleThresholdMinutes?: true
    keyboardHeartbeatMinutes?: true
    appUsageHeartbeatMinutes?: true
    browserHistorySyncMinutes?: true
  }

  export type MonitorCloudinarySettingSumAggregateInputType = {
    screenshotIntervalMinutes?: true
    mouseHeartbeatMinutes?: true
    mouseIdleThresholdMinutes?: true
    keyboardHeartbeatMinutes?: true
    appUsageHeartbeatMinutes?: true
    browserHistorySyncMinutes?: true
  }

  export type MonitorCloudinarySettingMinAggregateInputType = {
    organizationId?: true
    cloudName?: true
    apiKey?: true
    apiSecretCiphertext?: true
    apiSecretIv?: true
    apiSecretAuthTag?: true
    uploadFolderRoot?: true
    screenshotsEnabled?: true
    mouseEnabled?: true
    keyboardEnabled?: true
    appUsageEnabled?: true
    browserHistoryEnabled?: true
    usbEnabled?: true
    screenshotIntervalMinutes?: true
    mouseHeartbeatMinutes?: true
    mouseIdleThresholdMinutes?: true
    keyboardHeartbeatMinutes?: true
    appUsageHeartbeatMinutes?: true
    browserHistorySyncMinutes?: true
    updatedAt?: true
  }

  export type MonitorCloudinarySettingMaxAggregateInputType = {
    organizationId?: true
    cloudName?: true
    apiKey?: true
    apiSecretCiphertext?: true
    apiSecretIv?: true
    apiSecretAuthTag?: true
    uploadFolderRoot?: true
    screenshotsEnabled?: true
    mouseEnabled?: true
    keyboardEnabled?: true
    appUsageEnabled?: true
    browserHistoryEnabled?: true
    usbEnabled?: true
    screenshotIntervalMinutes?: true
    mouseHeartbeatMinutes?: true
    mouseIdleThresholdMinutes?: true
    keyboardHeartbeatMinutes?: true
    appUsageHeartbeatMinutes?: true
    browserHistorySyncMinutes?: true
    updatedAt?: true
  }

  export type MonitorCloudinarySettingCountAggregateInputType = {
    organizationId?: true
    cloudName?: true
    apiKey?: true
    apiSecretCiphertext?: true
    apiSecretIv?: true
    apiSecretAuthTag?: true
    uploadFolderRoot?: true
    screenshotsEnabled?: true
    mouseEnabled?: true
    keyboardEnabled?: true
    appUsageEnabled?: true
    browserHistoryEnabled?: true
    usbEnabled?: true
    screenshotIntervalMinutes?: true
    mouseHeartbeatMinutes?: true
    mouseIdleThresholdMinutes?: true
    keyboardHeartbeatMinutes?: true
    appUsageHeartbeatMinutes?: true
    browserHistorySyncMinutes?: true
    updatedAt?: true
    _all?: true
  }

  export type MonitorCloudinarySettingAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which MonitorCloudinarySetting to aggregate.
     */
    where?: MonitorCloudinarySettingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MonitorCloudinarySettings to fetch.
     */
    orderBy?: MonitorCloudinarySettingOrderByWithRelationInput | MonitorCloudinarySettingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: MonitorCloudinarySettingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MonitorCloudinarySettings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MonitorCloudinarySettings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned MonitorCloudinarySettings
    **/
    _count?: true | MonitorCloudinarySettingCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: MonitorCloudinarySettingAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: MonitorCloudinarySettingSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: MonitorCloudinarySettingMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: MonitorCloudinarySettingMaxAggregateInputType
  }

  export type GetMonitorCloudinarySettingAggregateType<T extends MonitorCloudinarySettingAggregateArgs> = {
        [P in keyof T & keyof AggregateMonitorCloudinarySetting]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateMonitorCloudinarySetting[P]>
      : GetScalarType<T[P], AggregateMonitorCloudinarySetting[P]>
  }




  export type MonitorCloudinarySettingGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: MonitorCloudinarySettingWhereInput
    orderBy?: MonitorCloudinarySettingOrderByWithAggregationInput | MonitorCloudinarySettingOrderByWithAggregationInput[]
    by: MonitorCloudinarySettingScalarFieldEnum[] | MonitorCloudinarySettingScalarFieldEnum
    having?: MonitorCloudinarySettingScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: MonitorCloudinarySettingCountAggregateInputType | true
    _avg?: MonitorCloudinarySettingAvgAggregateInputType
    _sum?: MonitorCloudinarySettingSumAggregateInputType
    _min?: MonitorCloudinarySettingMinAggregateInputType
    _max?: MonitorCloudinarySettingMaxAggregateInputType
  }

  export type MonitorCloudinarySettingGroupByOutputType = {
    organizationId: string
    cloudName: string
    apiKey: string
    apiSecretCiphertext: string
    apiSecretIv: string
    apiSecretAuthTag: string
    uploadFolderRoot: string
    screenshotsEnabled: boolean
    mouseEnabled: boolean
    keyboardEnabled: boolean
    appUsageEnabled: boolean
    browserHistoryEnabled: boolean
    usbEnabled: boolean
    screenshotIntervalMinutes: number
    mouseHeartbeatMinutes: number
    mouseIdleThresholdMinutes: number
    keyboardHeartbeatMinutes: number
    appUsageHeartbeatMinutes: number
    browserHistorySyncMinutes: number
    updatedAt: Date
    _count: MonitorCloudinarySettingCountAggregateOutputType | null
    _avg: MonitorCloudinarySettingAvgAggregateOutputType | null
    _sum: MonitorCloudinarySettingSumAggregateOutputType | null
    _min: MonitorCloudinarySettingMinAggregateOutputType | null
    _max: MonitorCloudinarySettingMaxAggregateOutputType | null
  }

  type GetMonitorCloudinarySettingGroupByPayload<T extends MonitorCloudinarySettingGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<MonitorCloudinarySettingGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof MonitorCloudinarySettingGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], MonitorCloudinarySettingGroupByOutputType[P]>
            : GetScalarType<T[P], MonitorCloudinarySettingGroupByOutputType[P]>
        }
      >
    >


  export type MonitorCloudinarySettingSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    organizationId?: boolean
    cloudName?: boolean
    apiKey?: boolean
    apiSecretCiphertext?: boolean
    apiSecretIv?: boolean
    apiSecretAuthTag?: boolean
    uploadFolderRoot?: boolean
    screenshotsEnabled?: boolean
    mouseEnabled?: boolean
    keyboardEnabled?: boolean
    appUsageEnabled?: boolean
    browserHistoryEnabled?: boolean
    usbEnabled?: boolean
    screenshotIntervalMinutes?: boolean
    mouseHeartbeatMinutes?: boolean
    mouseIdleThresholdMinutes?: boolean
    keyboardHeartbeatMinutes?: boolean
    appUsageHeartbeatMinutes?: boolean
    browserHistorySyncMinutes?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["monitorCloudinarySetting"]>

  export type MonitorCloudinarySettingSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    organizationId?: boolean
    cloudName?: boolean
    apiKey?: boolean
    apiSecretCiphertext?: boolean
    apiSecretIv?: boolean
    apiSecretAuthTag?: boolean
    uploadFolderRoot?: boolean
    screenshotsEnabled?: boolean
    mouseEnabled?: boolean
    keyboardEnabled?: boolean
    appUsageEnabled?: boolean
    browserHistoryEnabled?: boolean
    usbEnabled?: boolean
    screenshotIntervalMinutes?: boolean
    mouseHeartbeatMinutes?: boolean
    mouseIdleThresholdMinutes?: boolean
    keyboardHeartbeatMinutes?: boolean
    appUsageHeartbeatMinutes?: boolean
    browserHistorySyncMinutes?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["monitorCloudinarySetting"]>

  export type MonitorCloudinarySettingSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    organizationId?: boolean
    cloudName?: boolean
    apiKey?: boolean
    apiSecretCiphertext?: boolean
    apiSecretIv?: boolean
    apiSecretAuthTag?: boolean
    uploadFolderRoot?: boolean
    screenshotsEnabled?: boolean
    mouseEnabled?: boolean
    keyboardEnabled?: boolean
    appUsageEnabled?: boolean
    browserHistoryEnabled?: boolean
    usbEnabled?: boolean
    screenshotIntervalMinutes?: boolean
    mouseHeartbeatMinutes?: boolean
    mouseIdleThresholdMinutes?: boolean
    keyboardHeartbeatMinutes?: boolean
    appUsageHeartbeatMinutes?: boolean
    browserHistorySyncMinutes?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["monitorCloudinarySetting"]>

  export type MonitorCloudinarySettingSelectScalar = {
    organizationId?: boolean
    cloudName?: boolean
    apiKey?: boolean
    apiSecretCiphertext?: boolean
    apiSecretIv?: boolean
    apiSecretAuthTag?: boolean
    uploadFolderRoot?: boolean
    screenshotsEnabled?: boolean
    mouseEnabled?: boolean
    keyboardEnabled?: boolean
    appUsageEnabled?: boolean
    browserHistoryEnabled?: boolean
    usbEnabled?: boolean
    screenshotIntervalMinutes?: boolean
    mouseHeartbeatMinutes?: boolean
    mouseIdleThresholdMinutes?: boolean
    keyboardHeartbeatMinutes?: boolean
    appUsageHeartbeatMinutes?: boolean
    browserHistorySyncMinutes?: boolean
    updatedAt?: boolean
  }

  export type MonitorCloudinarySettingOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"organizationId" | "cloudName" | "apiKey" | "apiSecretCiphertext" | "apiSecretIv" | "apiSecretAuthTag" | "uploadFolderRoot" | "screenshotsEnabled" | "mouseEnabled" | "keyboardEnabled" | "appUsageEnabled" | "browserHistoryEnabled" | "usbEnabled" | "screenshotIntervalMinutes" | "mouseHeartbeatMinutes" | "mouseIdleThresholdMinutes" | "keyboardHeartbeatMinutes" | "appUsageHeartbeatMinutes" | "browserHistorySyncMinutes" | "updatedAt", ExtArgs["result"]["monitorCloudinarySetting"]>

  export type $MonitorCloudinarySettingPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "MonitorCloudinarySetting"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      organizationId: string
      cloudName: string
      apiKey: string
      apiSecretCiphertext: string
      apiSecretIv: string
      apiSecretAuthTag: string
      uploadFolderRoot: string
      screenshotsEnabled: boolean
      mouseEnabled: boolean
      keyboardEnabled: boolean
      appUsageEnabled: boolean
      browserHistoryEnabled: boolean
      usbEnabled: boolean
      screenshotIntervalMinutes: number
      mouseHeartbeatMinutes: number
      mouseIdleThresholdMinutes: number
      keyboardHeartbeatMinutes: number
      appUsageHeartbeatMinutes: number
      browserHistorySyncMinutes: number
      updatedAt: Date
    }, ExtArgs["result"]["monitorCloudinarySetting"]>
    composites: {}
  }

  type MonitorCloudinarySettingGetPayload<S extends boolean | null | undefined | MonitorCloudinarySettingDefaultArgs> = $Result.GetResult<Prisma.$MonitorCloudinarySettingPayload, S>

  type MonitorCloudinarySettingCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<MonitorCloudinarySettingFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: MonitorCloudinarySettingCountAggregateInputType | true
    }

  export interface MonitorCloudinarySettingDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['MonitorCloudinarySetting'], meta: { name: 'MonitorCloudinarySetting' } }
    /**
     * Find zero or one MonitorCloudinarySetting that matches the filter.
     * @param {MonitorCloudinarySettingFindUniqueArgs} args - Arguments to find a MonitorCloudinarySetting
     * @example
     * // Get one MonitorCloudinarySetting
     * const monitorCloudinarySetting = await prisma.monitorCloudinarySetting.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends MonitorCloudinarySettingFindUniqueArgs>(args: SelectSubset<T, MonitorCloudinarySettingFindUniqueArgs<ExtArgs>>): Prisma__MonitorCloudinarySettingClient<$Result.GetResult<Prisma.$MonitorCloudinarySettingPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one MonitorCloudinarySetting that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {MonitorCloudinarySettingFindUniqueOrThrowArgs} args - Arguments to find a MonitorCloudinarySetting
     * @example
     * // Get one MonitorCloudinarySetting
     * const monitorCloudinarySetting = await prisma.monitorCloudinarySetting.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends MonitorCloudinarySettingFindUniqueOrThrowArgs>(args: SelectSubset<T, MonitorCloudinarySettingFindUniqueOrThrowArgs<ExtArgs>>): Prisma__MonitorCloudinarySettingClient<$Result.GetResult<Prisma.$MonitorCloudinarySettingPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first MonitorCloudinarySetting that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MonitorCloudinarySettingFindFirstArgs} args - Arguments to find a MonitorCloudinarySetting
     * @example
     * // Get one MonitorCloudinarySetting
     * const monitorCloudinarySetting = await prisma.monitorCloudinarySetting.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends MonitorCloudinarySettingFindFirstArgs>(args?: SelectSubset<T, MonitorCloudinarySettingFindFirstArgs<ExtArgs>>): Prisma__MonitorCloudinarySettingClient<$Result.GetResult<Prisma.$MonitorCloudinarySettingPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first MonitorCloudinarySetting that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MonitorCloudinarySettingFindFirstOrThrowArgs} args - Arguments to find a MonitorCloudinarySetting
     * @example
     * // Get one MonitorCloudinarySetting
     * const monitorCloudinarySetting = await prisma.monitorCloudinarySetting.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends MonitorCloudinarySettingFindFirstOrThrowArgs>(args?: SelectSubset<T, MonitorCloudinarySettingFindFirstOrThrowArgs<ExtArgs>>): Prisma__MonitorCloudinarySettingClient<$Result.GetResult<Prisma.$MonitorCloudinarySettingPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more MonitorCloudinarySettings that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MonitorCloudinarySettingFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all MonitorCloudinarySettings
     * const monitorCloudinarySettings = await prisma.monitorCloudinarySetting.findMany()
     * 
     * // Get first 10 MonitorCloudinarySettings
     * const monitorCloudinarySettings = await prisma.monitorCloudinarySetting.findMany({ take: 10 })
     * 
     * // Only select the `organizationId`
     * const monitorCloudinarySettingWithOrganizationIdOnly = await prisma.monitorCloudinarySetting.findMany({ select: { organizationId: true } })
     * 
     */
    findMany<T extends MonitorCloudinarySettingFindManyArgs>(args?: SelectSubset<T, MonitorCloudinarySettingFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MonitorCloudinarySettingPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a MonitorCloudinarySetting.
     * @param {MonitorCloudinarySettingCreateArgs} args - Arguments to create a MonitorCloudinarySetting.
     * @example
     * // Create one MonitorCloudinarySetting
     * const MonitorCloudinarySetting = await prisma.monitorCloudinarySetting.create({
     *   data: {
     *     // ... data to create a MonitorCloudinarySetting
     *   }
     * })
     * 
     */
    create<T extends MonitorCloudinarySettingCreateArgs>(args: SelectSubset<T, MonitorCloudinarySettingCreateArgs<ExtArgs>>): Prisma__MonitorCloudinarySettingClient<$Result.GetResult<Prisma.$MonitorCloudinarySettingPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many MonitorCloudinarySettings.
     * @param {MonitorCloudinarySettingCreateManyArgs} args - Arguments to create many MonitorCloudinarySettings.
     * @example
     * // Create many MonitorCloudinarySettings
     * const monitorCloudinarySetting = await prisma.monitorCloudinarySetting.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends MonitorCloudinarySettingCreateManyArgs>(args?: SelectSubset<T, MonitorCloudinarySettingCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many MonitorCloudinarySettings and returns the data saved in the database.
     * @param {MonitorCloudinarySettingCreateManyAndReturnArgs} args - Arguments to create many MonitorCloudinarySettings.
     * @example
     * // Create many MonitorCloudinarySettings
     * const monitorCloudinarySetting = await prisma.monitorCloudinarySetting.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many MonitorCloudinarySettings and only return the `organizationId`
     * const monitorCloudinarySettingWithOrganizationIdOnly = await prisma.monitorCloudinarySetting.createManyAndReturn({
     *   select: { organizationId: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends MonitorCloudinarySettingCreateManyAndReturnArgs>(args?: SelectSubset<T, MonitorCloudinarySettingCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MonitorCloudinarySettingPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a MonitorCloudinarySetting.
     * @param {MonitorCloudinarySettingDeleteArgs} args - Arguments to delete one MonitorCloudinarySetting.
     * @example
     * // Delete one MonitorCloudinarySetting
     * const MonitorCloudinarySetting = await prisma.monitorCloudinarySetting.delete({
     *   where: {
     *     // ... filter to delete one MonitorCloudinarySetting
     *   }
     * })
     * 
     */
    delete<T extends MonitorCloudinarySettingDeleteArgs>(args: SelectSubset<T, MonitorCloudinarySettingDeleteArgs<ExtArgs>>): Prisma__MonitorCloudinarySettingClient<$Result.GetResult<Prisma.$MonitorCloudinarySettingPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one MonitorCloudinarySetting.
     * @param {MonitorCloudinarySettingUpdateArgs} args - Arguments to update one MonitorCloudinarySetting.
     * @example
     * // Update one MonitorCloudinarySetting
     * const monitorCloudinarySetting = await prisma.monitorCloudinarySetting.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends MonitorCloudinarySettingUpdateArgs>(args: SelectSubset<T, MonitorCloudinarySettingUpdateArgs<ExtArgs>>): Prisma__MonitorCloudinarySettingClient<$Result.GetResult<Prisma.$MonitorCloudinarySettingPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more MonitorCloudinarySettings.
     * @param {MonitorCloudinarySettingDeleteManyArgs} args - Arguments to filter MonitorCloudinarySettings to delete.
     * @example
     * // Delete a few MonitorCloudinarySettings
     * const { count } = await prisma.monitorCloudinarySetting.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends MonitorCloudinarySettingDeleteManyArgs>(args?: SelectSubset<T, MonitorCloudinarySettingDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more MonitorCloudinarySettings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MonitorCloudinarySettingUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many MonitorCloudinarySettings
     * const monitorCloudinarySetting = await prisma.monitorCloudinarySetting.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends MonitorCloudinarySettingUpdateManyArgs>(args: SelectSubset<T, MonitorCloudinarySettingUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more MonitorCloudinarySettings and returns the data updated in the database.
     * @param {MonitorCloudinarySettingUpdateManyAndReturnArgs} args - Arguments to update many MonitorCloudinarySettings.
     * @example
     * // Update many MonitorCloudinarySettings
     * const monitorCloudinarySetting = await prisma.monitorCloudinarySetting.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more MonitorCloudinarySettings and only return the `organizationId`
     * const monitorCloudinarySettingWithOrganizationIdOnly = await prisma.monitorCloudinarySetting.updateManyAndReturn({
     *   select: { organizationId: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends MonitorCloudinarySettingUpdateManyAndReturnArgs>(args: SelectSubset<T, MonitorCloudinarySettingUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MonitorCloudinarySettingPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one MonitorCloudinarySetting.
     * @param {MonitorCloudinarySettingUpsertArgs} args - Arguments to update or create a MonitorCloudinarySetting.
     * @example
     * // Update or create a MonitorCloudinarySetting
     * const monitorCloudinarySetting = await prisma.monitorCloudinarySetting.upsert({
     *   create: {
     *     // ... data to create a MonitorCloudinarySetting
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the MonitorCloudinarySetting we want to update
     *   }
     * })
     */
    upsert<T extends MonitorCloudinarySettingUpsertArgs>(args: SelectSubset<T, MonitorCloudinarySettingUpsertArgs<ExtArgs>>): Prisma__MonitorCloudinarySettingClient<$Result.GetResult<Prisma.$MonitorCloudinarySettingPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of MonitorCloudinarySettings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MonitorCloudinarySettingCountArgs} args - Arguments to filter MonitorCloudinarySettings to count.
     * @example
     * // Count the number of MonitorCloudinarySettings
     * const count = await prisma.monitorCloudinarySetting.count({
     *   where: {
     *     // ... the filter for the MonitorCloudinarySettings we want to count
     *   }
     * })
    **/
    count<T extends MonitorCloudinarySettingCountArgs>(
      args?: Subset<T, MonitorCloudinarySettingCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], MonitorCloudinarySettingCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a MonitorCloudinarySetting.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MonitorCloudinarySettingAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends MonitorCloudinarySettingAggregateArgs>(args: Subset<T, MonitorCloudinarySettingAggregateArgs>): Prisma.PrismaPromise<GetMonitorCloudinarySettingAggregateType<T>>

    /**
     * Group by MonitorCloudinarySetting.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MonitorCloudinarySettingGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends MonitorCloudinarySettingGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: MonitorCloudinarySettingGroupByArgs['orderBy'] }
        : { orderBy?: MonitorCloudinarySettingGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, MonitorCloudinarySettingGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetMonitorCloudinarySettingGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the MonitorCloudinarySetting model
   */
  readonly fields: MonitorCloudinarySettingFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for MonitorCloudinarySetting.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__MonitorCloudinarySettingClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the MonitorCloudinarySetting model
   */
  interface MonitorCloudinarySettingFieldRefs {
    readonly organizationId: FieldRef<"MonitorCloudinarySetting", 'String'>
    readonly cloudName: FieldRef<"MonitorCloudinarySetting", 'String'>
    readonly apiKey: FieldRef<"MonitorCloudinarySetting", 'String'>
    readonly apiSecretCiphertext: FieldRef<"MonitorCloudinarySetting", 'String'>
    readonly apiSecretIv: FieldRef<"MonitorCloudinarySetting", 'String'>
    readonly apiSecretAuthTag: FieldRef<"MonitorCloudinarySetting", 'String'>
    readonly uploadFolderRoot: FieldRef<"MonitorCloudinarySetting", 'String'>
    readonly screenshotsEnabled: FieldRef<"MonitorCloudinarySetting", 'Boolean'>
    readonly mouseEnabled: FieldRef<"MonitorCloudinarySetting", 'Boolean'>
    readonly keyboardEnabled: FieldRef<"MonitorCloudinarySetting", 'Boolean'>
    readonly appUsageEnabled: FieldRef<"MonitorCloudinarySetting", 'Boolean'>
    readonly browserHistoryEnabled: FieldRef<"MonitorCloudinarySetting", 'Boolean'>
    readonly usbEnabled: FieldRef<"MonitorCloudinarySetting", 'Boolean'>
    readonly screenshotIntervalMinutes: FieldRef<"MonitorCloudinarySetting", 'Int'>
    readonly mouseHeartbeatMinutes: FieldRef<"MonitorCloudinarySetting", 'Int'>
    readonly mouseIdleThresholdMinutes: FieldRef<"MonitorCloudinarySetting", 'Int'>
    readonly keyboardHeartbeatMinutes: FieldRef<"MonitorCloudinarySetting", 'Int'>
    readonly appUsageHeartbeatMinutes: FieldRef<"MonitorCloudinarySetting", 'Int'>
    readonly browserHistorySyncMinutes: FieldRef<"MonitorCloudinarySetting", 'Int'>
    readonly updatedAt: FieldRef<"MonitorCloudinarySetting", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * MonitorCloudinarySetting findUnique
   */
  export type MonitorCloudinarySettingFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorCloudinarySetting
     */
    select?: MonitorCloudinarySettingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorCloudinarySetting
     */
    omit?: MonitorCloudinarySettingOmit<ExtArgs> | null
    /**
     * Filter, which MonitorCloudinarySetting to fetch.
     */
    where: MonitorCloudinarySettingWhereUniqueInput
  }

  /**
   * MonitorCloudinarySetting findUniqueOrThrow
   */
  export type MonitorCloudinarySettingFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorCloudinarySetting
     */
    select?: MonitorCloudinarySettingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorCloudinarySetting
     */
    omit?: MonitorCloudinarySettingOmit<ExtArgs> | null
    /**
     * Filter, which MonitorCloudinarySetting to fetch.
     */
    where: MonitorCloudinarySettingWhereUniqueInput
  }

  /**
   * MonitorCloudinarySetting findFirst
   */
  export type MonitorCloudinarySettingFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorCloudinarySetting
     */
    select?: MonitorCloudinarySettingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorCloudinarySetting
     */
    omit?: MonitorCloudinarySettingOmit<ExtArgs> | null
    /**
     * Filter, which MonitorCloudinarySetting to fetch.
     */
    where?: MonitorCloudinarySettingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MonitorCloudinarySettings to fetch.
     */
    orderBy?: MonitorCloudinarySettingOrderByWithRelationInput | MonitorCloudinarySettingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for MonitorCloudinarySettings.
     */
    cursor?: MonitorCloudinarySettingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MonitorCloudinarySettings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MonitorCloudinarySettings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of MonitorCloudinarySettings.
     */
    distinct?: MonitorCloudinarySettingScalarFieldEnum | MonitorCloudinarySettingScalarFieldEnum[]
  }

  /**
   * MonitorCloudinarySetting findFirstOrThrow
   */
  export type MonitorCloudinarySettingFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorCloudinarySetting
     */
    select?: MonitorCloudinarySettingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorCloudinarySetting
     */
    omit?: MonitorCloudinarySettingOmit<ExtArgs> | null
    /**
     * Filter, which MonitorCloudinarySetting to fetch.
     */
    where?: MonitorCloudinarySettingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MonitorCloudinarySettings to fetch.
     */
    orderBy?: MonitorCloudinarySettingOrderByWithRelationInput | MonitorCloudinarySettingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for MonitorCloudinarySettings.
     */
    cursor?: MonitorCloudinarySettingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MonitorCloudinarySettings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MonitorCloudinarySettings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of MonitorCloudinarySettings.
     */
    distinct?: MonitorCloudinarySettingScalarFieldEnum | MonitorCloudinarySettingScalarFieldEnum[]
  }

  /**
   * MonitorCloudinarySetting findMany
   */
  export type MonitorCloudinarySettingFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorCloudinarySetting
     */
    select?: MonitorCloudinarySettingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorCloudinarySetting
     */
    omit?: MonitorCloudinarySettingOmit<ExtArgs> | null
    /**
     * Filter, which MonitorCloudinarySettings to fetch.
     */
    where?: MonitorCloudinarySettingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MonitorCloudinarySettings to fetch.
     */
    orderBy?: MonitorCloudinarySettingOrderByWithRelationInput | MonitorCloudinarySettingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing MonitorCloudinarySettings.
     */
    cursor?: MonitorCloudinarySettingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MonitorCloudinarySettings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MonitorCloudinarySettings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of MonitorCloudinarySettings.
     */
    distinct?: MonitorCloudinarySettingScalarFieldEnum | MonitorCloudinarySettingScalarFieldEnum[]
  }

  /**
   * MonitorCloudinarySetting create
   */
  export type MonitorCloudinarySettingCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorCloudinarySetting
     */
    select?: MonitorCloudinarySettingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorCloudinarySetting
     */
    omit?: MonitorCloudinarySettingOmit<ExtArgs> | null
    /**
     * The data needed to create a MonitorCloudinarySetting.
     */
    data: XOR<MonitorCloudinarySettingCreateInput, MonitorCloudinarySettingUncheckedCreateInput>
  }

  /**
   * MonitorCloudinarySetting createMany
   */
  export type MonitorCloudinarySettingCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many MonitorCloudinarySettings.
     */
    data: MonitorCloudinarySettingCreateManyInput | MonitorCloudinarySettingCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * MonitorCloudinarySetting createManyAndReturn
   */
  export type MonitorCloudinarySettingCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorCloudinarySetting
     */
    select?: MonitorCloudinarySettingSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorCloudinarySetting
     */
    omit?: MonitorCloudinarySettingOmit<ExtArgs> | null
    /**
     * The data used to create many MonitorCloudinarySettings.
     */
    data: MonitorCloudinarySettingCreateManyInput | MonitorCloudinarySettingCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * MonitorCloudinarySetting update
   */
  export type MonitorCloudinarySettingUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorCloudinarySetting
     */
    select?: MonitorCloudinarySettingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorCloudinarySetting
     */
    omit?: MonitorCloudinarySettingOmit<ExtArgs> | null
    /**
     * The data needed to update a MonitorCloudinarySetting.
     */
    data: XOR<MonitorCloudinarySettingUpdateInput, MonitorCloudinarySettingUncheckedUpdateInput>
    /**
     * Choose, which MonitorCloudinarySetting to update.
     */
    where: MonitorCloudinarySettingWhereUniqueInput
  }

  /**
   * MonitorCloudinarySetting updateMany
   */
  export type MonitorCloudinarySettingUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update MonitorCloudinarySettings.
     */
    data: XOR<MonitorCloudinarySettingUpdateManyMutationInput, MonitorCloudinarySettingUncheckedUpdateManyInput>
    /**
     * Filter which MonitorCloudinarySettings to update
     */
    where?: MonitorCloudinarySettingWhereInput
    /**
     * Limit how many MonitorCloudinarySettings to update.
     */
    limit?: number
  }

  /**
   * MonitorCloudinarySetting updateManyAndReturn
   */
  export type MonitorCloudinarySettingUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorCloudinarySetting
     */
    select?: MonitorCloudinarySettingSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorCloudinarySetting
     */
    omit?: MonitorCloudinarySettingOmit<ExtArgs> | null
    /**
     * The data used to update MonitorCloudinarySettings.
     */
    data: XOR<MonitorCloudinarySettingUpdateManyMutationInput, MonitorCloudinarySettingUncheckedUpdateManyInput>
    /**
     * Filter which MonitorCloudinarySettings to update
     */
    where?: MonitorCloudinarySettingWhereInput
    /**
     * Limit how many MonitorCloudinarySettings to update.
     */
    limit?: number
  }

  /**
   * MonitorCloudinarySetting upsert
   */
  export type MonitorCloudinarySettingUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorCloudinarySetting
     */
    select?: MonitorCloudinarySettingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorCloudinarySetting
     */
    omit?: MonitorCloudinarySettingOmit<ExtArgs> | null
    /**
     * The filter to search for the MonitorCloudinarySetting to update in case it exists.
     */
    where: MonitorCloudinarySettingWhereUniqueInput
    /**
     * In case the MonitorCloudinarySetting found by the `where` argument doesn't exist, create a new MonitorCloudinarySetting with this data.
     */
    create: XOR<MonitorCloudinarySettingCreateInput, MonitorCloudinarySettingUncheckedCreateInput>
    /**
     * In case the MonitorCloudinarySetting was found with the provided `where` argument, update it with this data.
     */
    update: XOR<MonitorCloudinarySettingUpdateInput, MonitorCloudinarySettingUncheckedUpdateInput>
  }

  /**
   * MonitorCloudinarySetting delete
   */
  export type MonitorCloudinarySettingDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorCloudinarySetting
     */
    select?: MonitorCloudinarySettingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorCloudinarySetting
     */
    omit?: MonitorCloudinarySettingOmit<ExtArgs> | null
    /**
     * Filter which MonitorCloudinarySetting to delete.
     */
    where: MonitorCloudinarySettingWhereUniqueInput
  }

  /**
   * MonitorCloudinarySetting deleteMany
   */
  export type MonitorCloudinarySettingDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which MonitorCloudinarySettings to delete
     */
    where?: MonitorCloudinarySettingWhereInput
    /**
     * Limit how many MonitorCloudinarySettings to delete.
     */
    limit?: number
  }

  /**
   * MonitorCloudinarySetting without action
   */
  export type MonitorCloudinarySettingDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorCloudinarySetting
     */
    select?: MonitorCloudinarySettingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorCloudinarySetting
     */
    omit?: MonitorCloudinarySettingOmit<ExtArgs> | null
  }


  /**
   * Model MonitorDeviceHealth
   */

  export type AggregateMonitorDeviceHealth = {
    _count: MonitorDeviceHealthCountAggregateOutputType | null
    _avg: MonitorDeviceHealthAvgAggregateOutputType | null
    _sum: MonitorDeviceHealthSumAggregateOutputType | null
    _min: MonitorDeviceHealthMinAggregateOutputType | null
    _max: MonitorDeviceHealthMaxAggregateOutputType | null
  }

  export type MonitorDeviceHealthAvgAggregateOutputType = {
    id: number | null
    cpuCoreCount: number | null
    cpuPercent: Decimal | null
    memoryTotalBytes: number | null
    memoryUsedBytes: number | null
    memoryPercent: Decimal | null
    temperatureC: Decimal | null
    batteryPercent: Decimal | null
    uptimeSeconds: number | null
  }

  export type MonitorDeviceHealthSumAggregateOutputType = {
    id: bigint | null
    cpuCoreCount: number | null
    cpuPercent: Decimal | null
    memoryTotalBytes: bigint | null
    memoryUsedBytes: bigint | null
    memoryPercent: Decimal | null
    temperatureC: Decimal | null
    batteryPercent: Decimal | null
    uptimeSeconds: bigint | null
  }

  export type MonitorDeviceHealthMinAggregateOutputType = {
    id: bigint | null
    organizationId: string | null
    employeeId: string | null
    employeeName: string | null
    employeeCode: string | null
    deviceId: string | null
    hostname: string | null
    platform: string | null
    platformVersion: string | null
    agentVersion: string | null
    cpuModel: string | null
    cpuCoreCount: number | null
    cpuPercent: Decimal | null
    memoryTotalBytes: bigint | null
    memoryUsedBytes: bigint | null
    memoryPercent: Decimal | null
    temperatureC: Decimal | null
    batteryPercent: Decimal | null
    batteryCharging: boolean | null
    uptimeSeconds: bigint | null
    lastSeenAt: Date | null
    reportedAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type MonitorDeviceHealthMaxAggregateOutputType = {
    id: bigint | null
    organizationId: string | null
    employeeId: string | null
    employeeName: string | null
    employeeCode: string | null
    deviceId: string | null
    hostname: string | null
    platform: string | null
    platformVersion: string | null
    agentVersion: string | null
    cpuModel: string | null
    cpuCoreCount: number | null
    cpuPercent: Decimal | null
    memoryTotalBytes: bigint | null
    memoryUsedBytes: bigint | null
    memoryPercent: Decimal | null
    temperatureC: Decimal | null
    batteryPercent: Decimal | null
    batteryCharging: boolean | null
    uptimeSeconds: bigint | null
    lastSeenAt: Date | null
    reportedAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type MonitorDeviceHealthCountAggregateOutputType = {
    id: number
    organizationId: number
    employeeId: number
    employeeName: number
    employeeCode: number
    deviceId: number
    hostname: number
    platform: number
    platformVersion: number
    agentVersion: number
    cpuModel: number
    cpuCoreCount: number
    cpuPercent: number
    memoryTotalBytes: number
    memoryUsedBytes: number
    memoryPercent: number
    disks: number
    temperatureC: number
    batteryPercent: number
    batteryCharging: number
    uptimeSeconds: number
    lastSeenAt: number
    reportedAt: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type MonitorDeviceHealthAvgAggregateInputType = {
    id?: true
    cpuCoreCount?: true
    cpuPercent?: true
    memoryTotalBytes?: true
    memoryUsedBytes?: true
    memoryPercent?: true
    temperatureC?: true
    batteryPercent?: true
    uptimeSeconds?: true
  }

  export type MonitorDeviceHealthSumAggregateInputType = {
    id?: true
    cpuCoreCount?: true
    cpuPercent?: true
    memoryTotalBytes?: true
    memoryUsedBytes?: true
    memoryPercent?: true
    temperatureC?: true
    batteryPercent?: true
    uptimeSeconds?: true
  }

  export type MonitorDeviceHealthMinAggregateInputType = {
    id?: true
    organizationId?: true
    employeeId?: true
    employeeName?: true
    employeeCode?: true
    deviceId?: true
    hostname?: true
    platform?: true
    platformVersion?: true
    agentVersion?: true
    cpuModel?: true
    cpuCoreCount?: true
    cpuPercent?: true
    memoryTotalBytes?: true
    memoryUsedBytes?: true
    memoryPercent?: true
    temperatureC?: true
    batteryPercent?: true
    batteryCharging?: true
    uptimeSeconds?: true
    lastSeenAt?: true
    reportedAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type MonitorDeviceHealthMaxAggregateInputType = {
    id?: true
    organizationId?: true
    employeeId?: true
    employeeName?: true
    employeeCode?: true
    deviceId?: true
    hostname?: true
    platform?: true
    platformVersion?: true
    agentVersion?: true
    cpuModel?: true
    cpuCoreCount?: true
    cpuPercent?: true
    memoryTotalBytes?: true
    memoryUsedBytes?: true
    memoryPercent?: true
    temperatureC?: true
    batteryPercent?: true
    batteryCharging?: true
    uptimeSeconds?: true
    lastSeenAt?: true
    reportedAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type MonitorDeviceHealthCountAggregateInputType = {
    id?: true
    organizationId?: true
    employeeId?: true
    employeeName?: true
    employeeCode?: true
    deviceId?: true
    hostname?: true
    platform?: true
    platformVersion?: true
    agentVersion?: true
    cpuModel?: true
    cpuCoreCount?: true
    cpuPercent?: true
    memoryTotalBytes?: true
    memoryUsedBytes?: true
    memoryPercent?: true
    disks?: true
    temperatureC?: true
    batteryPercent?: true
    batteryCharging?: true
    uptimeSeconds?: true
    lastSeenAt?: true
    reportedAt?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type MonitorDeviceHealthAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which MonitorDeviceHealth to aggregate.
     */
    where?: MonitorDeviceHealthWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MonitorDeviceHealths to fetch.
     */
    orderBy?: MonitorDeviceHealthOrderByWithRelationInput | MonitorDeviceHealthOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: MonitorDeviceHealthWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MonitorDeviceHealths from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MonitorDeviceHealths.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned MonitorDeviceHealths
    **/
    _count?: true | MonitorDeviceHealthCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: MonitorDeviceHealthAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: MonitorDeviceHealthSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: MonitorDeviceHealthMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: MonitorDeviceHealthMaxAggregateInputType
  }

  export type GetMonitorDeviceHealthAggregateType<T extends MonitorDeviceHealthAggregateArgs> = {
        [P in keyof T & keyof AggregateMonitorDeviceHealth]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateMonitorDeviceHealth[P]>
      : GetScalarType<T[P], AggregateMonitorDeviceHealth[P]>
  }




  export type MonitorDeviceHealthGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: MonitorDeviceHealthWhereInput
    orderBy?: MonitorDeviceHealthOrderByWithAggregationInput | MonitorDeviceHealthOrderByWithAggregationInput[]
    by: MonitorDeviceHealthScalarFieldEnum[] | MonitorDeviceHealthScalarFieldEnum
    having?: MonitorDeviceHealthScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: MonitorDeviceHealthCountAggregateInputType | true
    _avg?: MonitorDeviceHealthAvgAggregateInputType
    _sum?: MonitorDeviceHealthSumAggregateInputType
    _min?: MonitorDeviceHealthMinAggregateInputType
    _max?: MonitorDeviceHealthMaxAggregateInputType
  }

  export type MonitorDeviceHealthGroupByOutputType = {
    id: bigint
    organizationId: string | null
    employeeId: string
    employeeName: string | null
    employeeCode: string | null
    deviceId: string
    hostname: string | null
    platform: string | null
    platformVersion: string | null
    agentVersion: string | null
    cpuModel: string | null
    cpuCoreCount: number | null
    cpuPercent: Decimal | null
    memoryTotalBytes: bigint | null
    memoryUsedBytes: bigint | null
    memoryPercent: Decimal | null
    disks: JsonValue
    temperatureC: Decimal | null
    batteryPercent: Decimal | null
    batteryCharging: boolean | null
    uptimeSeconds: bigint | null
    lastSeenAt: Date
    reportedAt: Date
    createdAt: Date
    updatedAt: Date
    _count: MonitorDeviceHealthCountAggregateOutputType | null
    _avg: MonitorDeviceHealthAvgAggregateOutputType | null
    _sum: MonitorDeviceHealthSumAggregateOutputType | null
    _min: MonitorDeviceHealthMinAggregateOutputType | null
    _max: MonitorDeviceHealthMaxAggregateOutputType | null
  }

  type GetMonitorDeviceHealthGroupByPayload<T extends MonitorDeviceHealthGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<MonitorDeviceHealthGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof MonitorDeviceHealthGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], MonitorDeviceHealthGroupByOutputType[P]>
            : GetScalarType<T[P], MonitorDeviceHealthGroupByOutputType[P]>
        }
      >
    >


  export type MonitorDeviceHealthSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    organizationId?: boolean
    employeeId?: boolean
    employeeName?: boolean
    employeeCode?: boolean
    deviceId?: boolean
    hostname?: boolean
    platform?: boolean
    platformVersion?: boolean
    agentVersion?: boolean
    cpuModel?: boolean
    cpuCoreCount?: boolean
    cpuPercent?: boolean
    memoryTotalBytes?: boolean
    memoryUsedBytes?: boolean
    memoryPercent?: boolean
    disks?: boolean
    temperatureC?: boolean
    batteryPercent?: boolean
    batteryCharging?: boolean
    uptimeSeconds?: boolean
    lastSeenAt?: boolean
    reportedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["monitorDeviceHealth"]>

  export type MonitorDeviceHealthSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    organizationId?: boolean
    employeeId?: boolean
    employeeName?: boolean
    employeeCode?: boolean
    deviceId?: boolean
    hostname?: boolean
    platform?: boolean
    platformVersion?: boolean
    agentVersion?: boolean
    cpuModel?: boolean
    cpuCoreCount?: boolean
    cpuPercent?: boolean
    memoryTotalBytes?: boolean
    memoryUsedBytes?: boolean
    memoryPercent?: boolean
    disks?: boolean
    temperatureC?: boolean
    batteryPercent?: boolean
    batteryCharging?: boolean
    uptimeSeconds?: boolean
    lastSeenAt?: boolean
    reportedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["monitorDeviceHealth"]>

  export type MonitorDeviceHealthSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    organizationId?: boolean
    employeeId?: boolean
    employeeName?: boolean
    employeeCode?: boolean
    deviceId?: boolean
    hostname?: boolean
    platform?: boolean
    platformVersion?: boolean
    agentVersion?: boolean
    cpuModel?: boolean
    cpuCoreCount?: boolean
    cpuPercent?: boolean
    memoryTotalBytes?: boolean
    memoryUsedBytes?: boolean
    memoryPercent?: boolean
    disks?: boolean
    temperatureC?: boolean
    batteryPercent?: boolean
    batteryCharging?: boolean
    uptimeSeconds?: boolean
    lastSeenAt?: boolean
    reportedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["monitorDeviceHealth"]>

  export type MonitorDeviceHealthSelectScalar = {
    id?: boolean
    organizationId?: boolean
    employeeId?: boolean
    employeeName?: boolean
    employeeCode?: boolean
    deviceId?: boolean
    hostname?: boolean
    platform?: boolean
    platformVersion?: boolean
    agentVersion?: boolean
    cpuModel?: boolean
    cpuCoreCount?: boolean
    cpuPercent?: boolean
    memoryTotalBytes?: boolean
    memoryUsedBytes?: boolean
    memoryPercent?: boolean
    disks?: boolean
    temperatureC?: boolean
    batteryPercent?: boolean
    batteryCharging?: boolean
    uptimeSeconds?: boolean
    lastSeenAt?: boolean
    reportedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type MonitorDeviceHealthOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "organizationId" | "employeeId" | "employeeName" | "employeeCode" | "deviceId" | "hostname" | "platform" | "platformVersion" | "agentVersion" | "cpuModel" | "cpuCoreCount" | "cpuPercent" | "memoryTotalBytes" | "memoryUsedBytes" | "memoryPercent" | "disks" | "temperatureC" | "batteryPercent" | "batteryCharging" | "uptimeSeconds" | "lastSeenAt" | "reportedAt" | "createdAt" | "updatedAt", ExtArgs["result"]["monitorDeviceHealth"]>

  export type $MonitorDeviceHealthPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "MonitorDeviceHealth"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: bigint
      organizationId: string | null
      employeeId: string
      employeeName: string | null
      employeeCode: string | null
      deviceId: string
      hostname: string | null
      platform: string | null
      platformVersion: string | null
      agentVersion: string | null
      cpuModel: string | null
      cpuCoreCount: number | null
      cpuPercent: Prisma.Decimal | null
      memoryTotalBytes: bigint | null
      memoryUsedBytes: bigint | null
      memoryPercent: Prisma.Decimal | null
      disks: Prisma.JsonValue
      temperatureC: Prisma.Decimal | null
      batteryPercent: Prisma.Decimal | null
      batteryCharging: boolean | null
      uptimeSeconds: bigint | null
      lastSeenAt: Date
      reportedAt: Date
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["monitorDeviceHealth"]>
    composites: {}
  }

  type MonitorDeviceHealthGetPayload<S extends boolean | null | undefined | MonitorDeviceHealthDefaultArgs> = $Result.GetResult<Prisma.$MonitorDeviceHealthPayload, S>

  type MonitorDeviceHealthCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<MonitorDeviceHealthFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: MonitorDeviceHealthCountAggregateInputType | true
    }

  export interface MonitorDeviceHealthDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['MonitorDeviceHealth'], meta: { name: 'MonitorDeviceHealth' } }
    /**
     * Find zero or one MonitorDeviceHealth that matches the filter.
     * @param {MonitorDeviceHealthFindUniqueArgs} args - Arguments to find a MonitorDeviceHealth
     * @example
     * // Get one MonitorDeviceHealth
     * const monitorDeviceHealth = await prisma.monitorDeviceHealth.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends MonitorDeviceHealthFindUniqueArgs>(args: SelectSubset<T, MonitorDeviceHealthFindUniqueArgs<ExtArgs>>): Prisma__MonitorDeviceHealthClient<$Result.GetResult<Prisma.$MonitorDeviceHealthPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one MonitorDeviceHealth that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {MonitorDeviceHealthFindUniqueOrThrowArgs} args - Arguments to find a MonitorDeviceHealth
     * @example
     * // Get one MonitorDeviceHealth
     * const monitorDeviceHealth = await prisma.monitorDeviceHealth.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends MonitorDeviceHealthFindUniqueOrThrowArgs>(args: SelectSubset<T, MonitorDeviceHealthFindUniqueOrThrowArgs<ExtArgs>>): Prisma__MonitorDeviceHealthClient<$Result.GetResult<Prisma.$MonitorDeviceHealthPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first MonitorDeviceHealth that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MonitorDeviceHealthFindFirstArgs} args - Arguments to find a MonitorDeviceHealth
     * @example
     * // Get one MonitorDeviceHealth
     * const monitorDeviceHealth = await prisma.monitorDeviceHealth.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends MonitorDeviceHealthFindFirstArgs>(args?: SelectSubset<T, MonitorDeviceHealthFindFirstArgs<ExtArgs>>): Prisma__MonitorDeviceHealthClient<$Result.GetResult<Prisma.$MonitorDeviceHealthPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first MonitorDeviceHealth that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MonitorDeviceHealthFindFirstOrThrowArgs} args - Arguments to find a MonitorDeviceHealth
     * @example
     * // Get one MonitorDeviceHealth
     * const monitorDeviceHealth = await prisma.monitorDeviceHealth.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends MonitorDeviceHealthFindFirstOrThrowArgs>(args?: SelectSubset<T, MonitorDeviceHealthFindFirstOrThrowArgs<ExtArgs>>): Prisma__MonitorDeviceHealthClient<$Result.GetResult<Prisma.$MonitorDeviceHealthPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more MonitorDeviceHealths that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MonitorDeviceHealthFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all MonitorDeviceHealths
     * const monitorDeviceHealths = await prisma.monitorDeviceHealth.findMany()
     * 
     * // Get first 10 MonitorDeviceHealths
     * const monitorDeviceHealths = await prisma.monitorDeviceHealth.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const monitorDeviceHealthWithIdOnly = await prisma.monitorDeviceHealth.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends MonitorDeviceHealthFindManyArgs>(args?: SelectSubset<T, MonitorDeviceHealthFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MonitorDeviceHealthPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a MonitorDeviceHealth.
     * @param {MonitorDeviceHealthCreateArgs} args - Arguments to create a MonitorDeviceHealth.
     * @example
     * // Create one MonitorDeviceHealth
     * const MonitorDeviceHealth = await prisma.monitorDeviceHealth.create({
     *   data: {
     *     // ... data to create a MonitorDeviceHealth
     *   }
     * })
     * 
     */
    create<T extends MonitorDeviceHealthCreateArgs>(args: SelectSubset<T, MonitorDeviceHealthCreateArgs<ExtArgs>>): Prisma__MonitorDeviceHealthClient<$Result.GetResult<Prisma.$MonitorDeviceHealthPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many MonitorDeviceHealths.
     * @param {MonitorDeviceHealthCreateManyArgs} args - Arguments to create many MonitorDeviceHealths.
     * @example
     * // Create many MonitorDeviceHealths
     * const monitorDeviceHealth = await prisma.monitorDeviceHealth.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends MonitorDeviceHealthCreateManyArgs>(args?: SelectSubset<T, MonitorDeviceHealthCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many MonitorDeviceHealths and returns the data saved in the database.
     * @param {MonitorDeviceHealthCreateManyAndReturnArgs} args - Arguments to create many MonitorDeviceHealths.
     * @example
     * // Create many MonitorDeviceHealths
     * const monitorDeviceHealth = await prisma.monitorDeviceHealth.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many MonitorDeviceHealths and only return the `id`
     * const monitorDeviceHealthWithIdOnly = await prisma.monitorDeviceHealth.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends MonitorDeviceHealthCreateManyAndReturnArgs>(args?: SelectSubset<T, MonitorDeviceHealthCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MonitorDeviceHealthPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a MonitorDeviceHealth.
     * @param {MonitorDeviceHealthDeleteArgs} args - Arguments to delete one MonitorDeviceHealth.
     * @example
     * // Delete one MonitorDeviceHealth
     * const MonitorDeviceHealth = await prisma.monitorDeviceHealth.delete({
     *   where: {
     *     // ... filter to delete one MonitorDeviceHealth
     *   }
     * })
     * 
     */
    delete<T extends MonitorDeviceHealthDeleteArgs>(args: SelectSubset<T, MonitorDeviceHealthDeleteArgs<ExtArgs>>): Prisma__MonitorDeviceHealthClient<$Result.GetResult<Prisma.$MonitorDeviceHealthPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one MonitorDeviceHealth.
     * @param {MonitorDeviceHealthUpdateArgs} args - Arguments to update one MonitorDeviceHealth.
     * @example
     * // Update one MonitorDeviceHealth
     * const monitorDeviceHealth = await prisma.monitorDeviceHealth.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends MonitorDeviceHealthUpdateArgs>(args: SelectSubset<T, MonitorDeviceHealthUpdateArgs<ExtArgs>>): Prisma__MonitorDeviceHealthClient<$Result.GetResult<Prisma.$MonitorDeviceHealthPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more MonitorDeviceHealths.
     * @param {MonitorDeviceHealthDeleteManyArgs} args - Arguments to filter MonitorDeviceHealths to delete.
     * @example
     * // Delete a few MonitorDeviceHealths
     * const { count } = await prisma.monitorDeviceHealth.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends MonitorDeviceHealthDeleteManyArgs>(args?: SelectSubset<T, MonitorDeviceHealthDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more MonitorDeviceHealths.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MonitorDeviceHealthUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many MonitorDeviceHealths
     * const monitorDeviceHealth = await prisma.monitorDeviceHealth.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends MonitorDeviceHealthUpdateManyArgs>(args: SelectSubset<T, MonitorDeviceHealthUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more MonitorDeviceHealths and returns the data updated in the database.
     * @param {MonitorDeviceHealthUpdateManyAndReturnArgs} args - Arguments to update many MonitorDeviceHealths.
     * @example
     * // Update many MonitorDeviceHealths
     * const monitorDeviceHealth = await prisma.monitorDeviceHealth.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more MonitorDeviceHealths and only return the `id`
     * const monitorDeviceHealthWithIdOnly = await prisma.monitorDeviceHealth.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends MonitorDeviceHealthUpdateManyAndReturnArgs>(args: SelectSubset<T, MonitorDeviceHealthUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MonitorDeviceHealthPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one MonitorDeviceHealth.
     * @param {MonitorDeviceHealthUpsertArgs} args - Arguments to update or create a MonitorDeviceHealth.
     * @example
     * // Update or create a MonitorDeviceHealth
     * const monitorDeviceHealth = await prisma.monitorDeviceHealth.upsert({
     *   create: {
     *     // ... data to create a MonitorDeviceHealth
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the MonitorDeviceHealth we want to update
     *   }
     * })
     */
    upsert<T extends MonitorDeviceHealthUpsertArgs>(args: SelectSubset<T, MonitorDeviceHealthUpsertArgs<ExtArgs>>): Prisma__MonitorDeviceHealthClient<$Result.GetResult<Prisma.$MonitorDeviceHealthPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of MonitorDeviceHealths.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MonitorDeviceHealthCountArgs} args - Arguments to filter MonitorDeviceHealths to count.
     * @example
     * // Count the number of MonitorDeviceHealths
     * const count = await prisma.monitorDeviceHealth.count({
     *   where: {
     *     // ... the filter for the MonitorDeviceHealths we want to count
     *   }
     * })
    **/
    count<T extends MonitorDeviceHealthCountArgs>(
      args?: Subset<T, MonitorDeviceHealthCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], MonitorDeviceHealthCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a MonitorDeviceHealth.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MonitorDeviceHealthAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends MonitorDeviceHealthAggregateArgs>(args: Subset<T, MonitorDeviceHealthAggregateArgs>): Prisma.PrismaPromise<GetMonitorDeviceHealthAggregateType<T>>

    /**
     * Group by MonitorDeviceHealth.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MonitorDeviceHealthGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends MonitorDeviceHealthGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: MonitorDeviceHealthGroupByArgs['orderBy'] }
        : { orderBy?: MonitorDeviceHealthGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, MonitorDeviceHealthGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetMonitorDeviceHealthGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the MonitorDeviceHealth model
   */
  readonly fields: MonitorDeviceHealthFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for MonitorDeviceHealth.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__MonitorDeviceHealthClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the MonitorDeviceHealth model
   */
  interface MonitorDeviceHealthFieldRefs {
    readonly id: FieldRef<"MonitorDeviceHealth", 'BigInt'>
    readonly organizationId: FieldRef<"MonitorDeviceHealth", 'String'>
    readonly employeeId: FieldRef<"MonitorDeviceHealth", 'String'>
    readonly employeeName: FieldRef<"MonitorDeviceHealth", 'String'>
    readonly employeeCode: FieldRef<"MonitorDeviceHealth", 'String'>
    readonly deviceId: FieldRef<"MonitorDeviceHealth", 'String'>
    readonly hostname: FieldRef<"MonitorDeviceHealth", 'String'>
    readonly platform: FieldRef<"MonitorDeviceHealth", 'String'>
    readonly platformVersion: FieldRef<"MonitorDeviceHealth", 'String'>
    readonly agentVersion: FieldRef<"MonitorDeviceHealth", 'String'>
    readonly cpuModel: FieldRef<"MonitorDeviceHealth", 'String'>
    readonly cpuCoreCount: FieldRef<"MonitorDeviceHealth", 'Int'>
    readonly cpuPercent: FieldRef<"MonitorDeviceHealth", 'Decimal'>
    readonly memoryTotalBytes: FieldRef<"MonitorDeviceHealth", 'BigInt'>
    readonly memoryUsedBytes: FieldRef<"MonitorDeviceHealth", 'BigInt'>
    readonly memoryPercent: FieldRef<"MonitorDeviceHealth", 'Decimal'>
    readonly disks: FieldRef<"MonitorDeviceHealth", 'Json'>
    readonly temperatureC: FieldRef<"MonitorDeviceHealth", 'Decimal'>
    readonly batteryPercent: FieldRef<"MonitorDeviceHealth", 'Decimal'>
    readonly batteryCharging: FieldRef<"MonitorDeviceHealth", 'Boolean'>
    readonly uptimeSeconds: FieldRef<"MonitorDeviceHealth", 'BigInt'>
    readonly lastSeenAt: FieldRef<"MonitorDeviceHealth", 'DateTime'>
    readonly reportedAt: FieldRef<"MonitorDeviceHealth", 'DateTime'>
    readonly createdAt: FieldRef<"MonitorDeviceHealth", 'DateTime'>
    readonly updatedAt: FieldRef<"MonitorDeviceHealth", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * MonitorDeviceHealth findUnique
   */
  export type MonitorDeviceHealthFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorDeviceHealth
     */
    select?: MonitorDeviceHealthSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorDeviceHealth
     */
    omit?: MonitorDeviceHealthOmit<ExtArgs> | null
    /**
     * Filter, which MonitorDeviceHealth to fetch.
     */
    where: MonitorDeviceHealthWhereUniqueInput
  }

  /**
   * MonitorDeviceHealth findUniqueOrThrow
   */
  export type MonitorDeviceHealthFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorDeviceHealth
     */
    select?: MonitorDeviceHealthSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorDeviceHealth
     */
    omit?: MonitorDeviceHealthOmit<ExtArgs> | null
    /**
     * Filter, which MonitorDeviceHealth to fetch.
     */
    where: MonitorDeviceHealthWhereUniqueInput
  }

  /**
   * MonitorDeviceHealth findFirst
   */
  export type MonitorDeviceHealthFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorDeviceHealth
     */
    select?: MonitorDeviceHealthSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorDeviceHealth
     */
    omit?: MonitorDeviceHealthOmit<ExtArgs> | null
    /**
     * Filter, which MonitorDeviceHealth to fetch.
     */
    where?: MonitorDeviceHealthWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MonitorDeviceHealths to fetch.
     */
    orderBy?: MonitorDeviceHealthOrderByWithRelationInput | MonitorDeviceHealthOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for MonitorDeviceHealths.
     */
    cursor?: MonitorDeviceHealthWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MonitorDeviceHealths from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MonitorDeviceHealths.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of MonitorDeviceHealths.
     */
    distinct?: MonitorDeviceHealthScalarFieldEnum | MonitorDeviceHealthScalarFieldEnum[]
  }

  /**
   * MonitorDeviceHealth findFirstOrThrow
   */
  export type MonitorDeviceHealthFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorDeviceHealth
     */
    select?: MonitorDeviceHealthSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorDeviceHealth
     */
    omit?: MonitorDeviceHealthOmit<ExtArgs> | null
    /**
     * Filter, which MonitorDeviceHealth to fetch.
     */
    where?: MonitorDeviceHealthWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MonitorDeviceHealths to fetch.
     */
    orderBy?: MonitorDeviceHealthOrderByWithRelationInput | MonitorDeviceHealthOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for MonitorDeviceHealths.
     */
    cursor?: MonitorDeviceHealthWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MonitorDeviceHealths from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MonitorDeviceHealths.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of MonitorDeviceHealths.
     */
    distinct?: MonitorDeviceHealthScalarFieldEnum | MonitorDeviceHealthScalarFieldEnum[]
  }

  /**
   * MonitorDeviceHealth findMany
   */
  export type MonitorDeviceHealthFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorDeviceHealth
     */
    select?: MonitorDeviceHealthSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorDeviceHealth
     */
    omit?: MonitorDeviceHealthOmit<ExtArgs> | null
    /**
     * Filter, which MonitorDeviceHealths to fetch.
     */
    where?: MonitorDeviceHealthWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MonitorDeviceHealths to fetch.
     */
    orderBy?: MonitorDeviceHealthOrderByWithRelationInput | MonitorDeviceHealthOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing MonitorDeviceHealths.
     */
    cursor?: MonitorDeviceHealthWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MonitorDeviceHealths from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MonitorDeviceHealths.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of MonitorDeviceHealths.
     */
    distinct?: MonitorDeviceHealthScalarFieldEnum | MonitorDeviceHealthScalarFieldEnum[]
  }

  /**
   * MonitorDeviceHealth create
   */
  export type MonitorDeviceHealthCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorDeviceHealth
     */
    select?: MonitorDeviceHealthSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorDeviceHealth
     */
    omit?: MonitorDeviceHealthOmit<ExtArgs> | null
    /**
     * The data needed to create a MonitorDeviceHealth.
     */
    data: XOR<MonitorDeviceHealthCreateInput, MonitorDeviceHealthUncheckedCreateInput>
  }

  /**
   * MonitorDeviceHealth createMany
   */
  export type MonitorDeviceHealthCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many MonitorDeviceHealths.
     */
    data: MonitorDeviceHealthCreateManyInput | MonitorDeviceHealthCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * MonitorDeviceHealth createManyAndReturn
   */
  export type MonitorDeviceHealthCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorDeviceHealth
     */
    select?: MonitorDeviceHealthSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorDeviceHealth
     */
    omit?: MonitorDeviceHealthOmit<ExtArgs> | null
    /**
     * The data used to create many MonitorDeviceHealths.
     */
    data: MonitorDeviceHealthCreateManyInput | MonitorDeviceHealthCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * MonitorDeviceHealth update
   */
  export type MonitorDeviceHealthUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorDeviceHealth
     */
    select?: MonitorDeviceHealthSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorDeviceHealth
     */
    omit?: MonitorDeviceHealthOmit<ExtArgs> | null
    /**
     * The data needed to update a MonitorDeviceHealth.
     */
    data: XOR<MonitorDeviceHealthUpdateInput, MonitorDeviceHealthUncheckedUpdateInput>
    /**
     * Choose, which MonitorDeviceHealth to update.
     */
    where: MonitorDeviceHealthWhereUniqueInput
  }

  /**
   * MonitorDeviceHealth updateMany
   */
  export type MonitorDeviceHealthUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update MonitorDeviceHealths.
     */
    data: XOR<MonitorDeviceHealthUpdateManyMutationInput, MonitorDeviceHealthUncheckedUpdateManyInput>
    /**
     * Filter which MonitorDeviceHealths to update
     */
    where?: MonitorDeviceHealthWhereInput
    /**
     * Limit how many MonitorDeviceHealths to update.
     */
    limit?: number
  }

  /**
   * MonitorDeviceHealth updateManyAndReturn
   */
  export type MonitorDeviceHealthUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorDeviceHealth
     */
    select?: MonitorDeviceHealthSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorDeviceHealth
     */
    omit?: MonitorDeviceHealthOmit<ExtArgs> | null
    /**
     * The data used to update MonitorDeviceHealths.
     */
    data: XOR<MonitorDeviceHealthUpdateManyMutationInput, MonitorDeviceHealthUncheckedUpdateManyInput>
    /**
     * Filter which MonitorDeviceHealths to update
     */
    where?: MonitorDeviceHealthWhereInput
    /**
     * Limit how many MonitorDeviceHealths to update.
     */
    limit?: number
  }

  /**
   * MonitorDeviceHealth upsert
   */
  export type MonitorDeviceHealthUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorDeviceHealth
     */
    select?: MonitorDeviceHealthSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorDeviceHealth
     */
    omit?: MonitorDeviceHealthOmit<ExtArgs> | null
    /**
     * The filter to search for the MonitorDeviceHealth to update in case it exists.
     */
    where: MonitorDeviceHealthWhereUniqueInput
    /**
     * In case the MonitorDeviceHealth found by the `where` argument doesn't exist, create a new MonitorDeviceHealth with this data.
     */
    create: XOR<MonitorDeviceHealthCreateInput, MonitorDeviceHealthUncheckedCreateInput>
    /**
     * In case the MonitorDeviceHealth was found with the provided `where` argument, update it with this data.
     */
    update: XOR<MonitorDeviceHealthUpdateInput, MonitorDeviceHealthUncheckedUpdateInput>
  }

  /**
   * MonitorDeviceHealth delete
   */
  export type MonitorDeviceHealthDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorDeviceHealth
     */
    select?: MonitorDeviceHealthSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorDeviceHealth
     */
    omit?: MonitorDeviceHealthOmit<ExtArgs> | null
    /**
     * Filter which MonitorDeviceHealth to delete.
     */
    where: MonitorDeviceHealthWhereUniqueInput
  }

  /**
   * MonitorDeviceHealth deleteMany
   */
  export type MonitorDeviceHealthDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which MonitorDeviceHealths to delete
     */
    where?: MonitorDeviceHealthWhereInput
    /**
     * Limit how many MonitorDeviceHealths to delete.
     */
    limit?: number
  }

  /**
   * MonitorDeviceHealth without action
   */
  export type MonitorDeviceHealthDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorDeviceHealth
     */
    select?: MonitorDeviceHealthSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorDeviceHealth
     */
    omit?: MonitorDeviceHealthOmit<ExtArgs> | null
  }


  /**
   * Model MonitorScreenshotBatch
   */

  export type AggregateMonitorScreenshotBatch = {
    _count: MonitorScreenshotBatchCountAggregateOutputType | null
    _avg: MonitorScreenshotBatchAvgAggregateOutputType | null
    _sum: MonitorScreenshotBatchSumAggregateOutputType | null
    _min: MonitorScreenshotBatchMinAggregateOutputType | null
    _max: MonitorScreenshotBatchMaxAggregateOutputType | null
  }

  export type MonitorScreenshotBatchAvgAggregateOutputType = {
    expectedCount: number | null
    uploadedCount: number | null
    duplicateCount: number | null
    expectedBytes: number | null
    uploadedBytes: number | null
  }

  export type MonitorScreenshotBatchSumAggregateOutputType = {
    expectedCount: number | null
    uploadedCount: number | null
    duplicateCount: number | null
    expectedBytes: bigint | null
    uploadedBytes: bigint | null
  }

  export type MonitorScreenshotBatchMinAggregateOutputType = {
    id: string | null
    organizationId: string | null
    employeeId: string | null
    deviceId: string | null
    status: string | null
    expectedCount: number | null
    uploadedCount: number | null
    duplicateCount: number | null
    expectedBytes: bigint | null
    uploadedBytes: bigint | null
    firstCapturedAt: Date | null
    lastCapturedAt: Date | null
    createdAt: Date | null
    completedAt: Date | null
  }

  export type MonitorScreenshotBatchMaxAggregateOutputType = {
    id: string | null
    organizationId: string | null
    employeeId: string | null
    deviceId: string | null
    status: string | null
    expectedCount: number | null
    uploadedCount: number | null
    duplicateCount: number | null
    expectedBytes: bigint | null
    uploadedBytes: bigint | null
    firstCapturedAt: Date | null
    lastCapturedAt: Date | null
    createdAt: Date | null
    completedAt: Date | null
  }

  export type MonitorScreenshotBatchCountAggregateOutputType = {
    id: number
    organizationId: number
    employeeId: number
    deviceId: number
    status: number
    expectedCount: number
    uploadedCount: number
    duplicateCount: number
    expectedBytes: number
    uploadedBytes: number
    firstCapturedAt: number
    lastCapturedAt: number
    createdAt: number
    completedAt: number
    _all: number
  }


  export type MonitorScreenshotBatchAvgAggregateInputType = {
    expectedCount?: true
    uploadedCount?: true
    duplicateCount?: true
    expectedBytes?: true
    uploadedBytes?: true
  }

  export type MonitorScreenshotBatchSumAggregateInputType = {
    expectedCount?: true
    uploadedCount?: true
    duplicateCount?: true
    expectedBytes?: true
    uploadedBytes?: true
  }

  export type MonitorScreenshotBatchMinAggregateInputType = {
    id?: true
    organizationId?: true
    employeeId?: true
    deviceId?: true
    status?: true
    expectedCount?: true
    uploadedCount?: true
    duplicateCount?: true
    expectedBytes?: true
    uploadedBytes?: true
    firstCapturedAt?: true
    lastCapturedAt?: true
    createdAt?: true
    completedAt?: true
  }

  export type MonitorScreenshotBatchMaxAggregateInputType = {
    id?: true
    organizationId?: true
    employeeId?: true
    deviceId?: true
    status?: true
    expectedCount?: true
    uploadedCount?: true
    duplicateCount?: true
    expectedBytes?: true
    uploadedBytes?: true
    firstCapturedAt?: true
    lastCapturedAt?: true
    createdAt?: true
    completedAt?: true
  }

  export type MonitorScreenshotBatchCountAggregateInputType = {
    id?: true
    organizationId?: true
    employeeId?: true
    deviceId?: true
    status?: true
    expectedCount?: true
    uploadedCount?: true
    duplicateCount?: true
    expectedBytes?: true
    uploadedBytes?: true
    firstCapturedAt?: true
    lastCapturedAt?: true
    createdAt?: true
    completedAt?: true
    _all?: true
  }

  export type MonitorScreenshotBatchAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which MonitorScreenshotBatch to aggregate.
     */
    where?: MonitorScreenshotBatchWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MonitorScreenshotBatches to fetch.
     */
    orderBy?: MonitorScreenshotBatchOrderByWithRelationInput | MonitorScreenshotBatchOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: MonitorScreenshotBatchWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MonitorScreenshotBatches from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MonitorScreenshotBatches.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned MonitorScreenshotBatches
    **/
    _count?: true | MonitorScreenshotBatchCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: MonitorScreenshotBatchAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: MonitorScreenshotBatchSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: MonitorScreenshotBatchMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: MonitorScreenshotBatchMaxAggregateInputType
  }

  export type GetMonitorScreenshotBatchAggregateType<T extends MonitorScreenshotBatchAggregateArgs> = {
        [P in keyof T & keyof AggregateMonitorScreenshotBatch]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateMonitorScreenshotBatch[P]>
      : GetScalarType<T[P], AggregateMonitorScreenshotBatch[P]>
  }




  export type MonitorScreenshotBatchGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: MonitorScreenshotBatchWhereInput
    orderBy?: MonitorScreenshotBatchOrderByWithAggregationInput | MonitorScreenshotBatchOrderByWithAggregationInput[]
    by: MonitorScreenshotBatchScalarFieldEnum[] | MonitorScreenshotBatchScalarFieldEnum
    having?: MonitorScreenshotBatchScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: MonitorScreenshotBatchCountAggregateInputType | true
    _avg?: MonitorScreenshotBatchAvgAggregateInputType
    _sum?: MonitorScreenshotBatchSumAggregateInputType
    _min?: MonitorScreenshotBatchMinAggregateInputType
    _max?: MonitorScreenshotBatchMaxAggregateInputType
  }

  export type MonitorScreenshotBatchGroupByOutputType = {
    id: string
    organizationId: string | null
    employeeId: string
    deviceId: string
    status: string
    expectedCount: number
    uploadedCount: number
    duplicateCount: number
    expectedBytes: bigint
    uploadedBytes: bigint
    firstCapturedAt: Date | null
    lastCapturedAt: Date | null
    createdAt: Date
    completedAt: Date | null
    _count: MonitorScreenshotBatchCountAggregateOutputType | null
    _avg: MonitorScreenshotBatchAvgAggregateOutputType | null
    _sum: MonitorScreenshotBatchSumAggregateOutputType | null
    _min: MonitorScreenshotBatchMinAggregateOutputType | null
    _max: MonitorScreenshotBatchMaxAggregateOutputType | null
  }

  type GetMonitorScreenshotBatchGroupByPayload<T extends MonitorScreenshotBatchGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<MonitorScreenshotBatchGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof MonitorScreenshotBatchGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], MonitorScreenshotBatchGroupByOutputType[P]>
            : GetScalarType<T[P], MonitorScreenshotBatchGroupByOutputType[P]>
        }
      >
    >


  export type MonitorScreenshotBatchSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    organizationId?: boolean
    employeeId?: boolean
    deviceId?: boolean
    status?: boolean
    expectedCount?: boolean
    uploadedCount?: boolean
    duplicateCount?: boolean
    expectedBytes?: boolean
    uploadedBytes?: boolean
    firstCapturedAt?: boolean
    lastCapturedAt?: boolean
    createdAt?: boolean
    completedAt?: boolean
    screenshots?: boolean | MonitorScreenshotBatch$screenshotsArgs<ExtArgs>
    _count?: boolean | MonitorScreenshotBatchCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["monitorScreenshotBatch"]>

  export type MonitorScreenshotBatchSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    organizationId?: boolean
    employeeId?: boolean
    deviceId?: boolean
    status?: boolean
    expectedCount?: boolean
    uploadedCount?: boolean
    duplicateCount?: boolean
    expectedBytes?: boolean
    uploadedBytes?: boolean
    firstCapturedAt?: boolean
    lastCapturedAt?: boolean
    createdAt?: boolean
    completedAt?: boolean
  }, ExtArgs["result"]["monitorScreenshotBatch"]>

  export type MonitorScreenshotBatchSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    organizationId?: boolean
    employeeId?: boolean
    deviceId?: boolean
    status?: boolean
    expectedCount?: boolean
    uploadedCount?: boolean
    duplicateCount?: boolean
    expectedBytes?: boolean
    uploadedBytes?: boolean
    firstCapturedAt?: boolean
    lastCapturedAt?: boolean
    createdAt?: boolean
    completedAt?: boolean
  }, ExtArgs["result"]["monitorScreenshotBatch"]>

  export type MonitorScreenshotBatchSelectScalar = {
    id?: boolean
    organizationId?: boolean
    employeeId?: boolean
    deviceId?: boolean
    status?: boolean
    expectedCount?: boolean
    uploadedCount?: boolean
    duplicateCount?: boolean
    expectedBytes?: boolean
    uploadedBytes?: boolean
    firstCapturedAt?: boolean
    lastCapturedAt?: boolean
    createdAt?: boolean
    completedAt?: boolean
  }

  export type MonitorScreenshotBatchOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "organizationId" | "employeeId" | "deviceId" | "status" | "expectedCount" | "uploadedCount" | "duplicateCount" | "expectedBytes" | "uploadedBytes" | "firstCapturedAt" | "lastCapturedAt" | "createdAt" | "completedAt", ExtArgs["result"]["monitorScreenshotBatch"]>
  export type MonitorScreenshotBatchInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    screenshots?: boolean | MonitorScreenshotBatch$screenshotsArgs<ExtArgs>
    _count?: boolean | MonitorScreenshotBatchCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type MonitorScreenshotBatchIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type MonitorScreenshotBatchIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $MonitorScreenshotBatchPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "MonitorScreenshotBatch"
    objects: {
      screenshots: Prisma.$MonitorScreenshotPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      organizationId: string | null
      employeeId: string
      deviceId: string
      status: string
      expectedCount: number
      uploadedCount: number
      duplicateCount: number
      expectedBytes: bigint
      uploadedBytes: bigint
      firstCapturedAt: Date | null
      lastCapturedAt: Date | null
      createdAt: Date
      completedAt: Date | null
    }, ExtArgs["result"]["monitorScreenshotBatch"]>
    composites: {}
  }

  type MonitorScreenshotBatchGetPayload<S extends boolean | null | undefined | MonitorScreenshotBatchDefaultArgs> = $Result.GetResult<Prisma.$MonitorScreenshotBatchPayload, S>

  type MonitorScreenshotBatchCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<MonitorScreenshotBatchFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: MonitorScreenshotBatchCountAggregateInputType | true
    }

  export interface MonitorScreenshotBatchDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['MonitorScreenshotBatch'], meta: { name: 'MonitorScreenshotBatch' } }
    /**
     * Find zero or one MonitorScreenshotBatch that matches the filter.
     * @param {MonitorScreenshotBatchFindUniqueArgs} args - Arguments to find a MonitorScreenshotBatch
     * @example
     * // Get one MonitorScreenshotBatch
     * const monitorScreenshotBatch = await prisma.monitorScreenshotBatch.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends MonitorScreenshotBatchFindUniqueArgs>(args: SelectSubset<T, MonitorScreenshotBatchFindUniqueArgs<ExtArgs>>): Prisma__MonitorScreenshotBatchClient<$Result.GetResult<Prisma.$MonitorScreenshotBatchPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one MonitorScreenshotBatch that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {MonitorScreenshotBatchFindUniqueOrThrowArgs} args - Arguments to find a MonitorScreenshotBatch
     * @example
     * // Get one MonitorScreenshotBatch
     * const monitorScreenshotBatch = await prisma.monitorScreenshotBatch.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends MonitorScreenshotBatchFindUniqueOrThrowArgs>(args: SelectSubset<T, MonitorScreenshotBatchFindUniqueOrThrowArgs<ExtArgs>>): Prisma__MonitorScreenshotBatchClient<$Result.GetResult<Prisma.$MonitorScreenshotBatchPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first MonitorScreenshotBatch that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MonitorScreenshotBatchFindFirstArgs} args - Arguments to find a MonitorScreenshotBatch
     * @example
     * // Get one MonitorScreenshotBatch
     * const monitorScreenshotBatch = await prisma.monitorScreenshotBatch.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends MonitorScreenshotBatchFindFirstArgs>(args?: SelectSubset<T, MonitorScreenshotBatchFindFirstArgs<ExtArgs>>): Prisma__MonitorScreenshotBatchClient<$Result.GetResult<Prisma.$MonitorScreenshotBatchPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first MonitorScreenshotBatch that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MonitorScreenshotBatchFindFirstOrThrowArgs} args - Arguments to find a MonitorScreenshotBatch
     * @example
     * // Get one MonitorScreenshotBatch
     * const monitorScreenshotBatch = await prisma.monitorScreenshotBatch.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends MonitorScreenshotBatchFindFirstOrThrowArgs>(args?: SelectSubset<T, MonitorScreenshotBatchFindFirstOrThrowArgs<ExtArgs>>): Prisma__MonitorScreenshotBatchClient<$Result.GetResult<Prisma.$MonitorScreenshotBatchPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more MonitorScreenshotBatches that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MonitorScreenshotBatchFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all MonitorScreenshotBatches
     * const monitorScreenshotBatches = await prisma.monitorScreenshotBatch.findMany()
     * 
     * // Get first 10 MonitorScreenshotBatches
     * const monitorScreenshotBatches = await prisma.monitorScreenshotBatch.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const monitorScreenshotBatchWithIdOnly = await prisma.monitorScreenshotBatch.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends MonitorScreenshotBatchFindManyArgs>(args?: SelectSubset<T, MonitorScreenshotBatchFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MonitorScreenshotBatchPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a MonitorScreenshotBatch.
     * @param {MonitorScreenshotBatchCreateArgs} args - Arguments to create a MonitorScreenshotBatch.
     * @example
     * // Create one MonitorScreenshotBatch
     * const MonitorScreenshotBatch = await prisma.monitorScreenshotBatch.create({
     *   data: {
     *     // ... data to create a MonitorScreenshotBatch
     *   }
     * })
     * 
     */
    create<T extends MonitorScreenshotBatchCreateArgs>(args: SelectSubset<T, MonitorScreenshotBatchCreateArgs<ExtArgs>>): Prisma__MonitorScreenshotBatchClient<$Result.GetResult<Prisma.$MonitorScreenshotBatchPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many MonitorScreenshotBatches.
     * @param {MonitorScreenshotBatchCreateManyArgs} args - Arguments to create many MonitorScreenshotBatches.
     * @example
     * // Create many MonitorScreenshotBatches
     * const monitorScreenshotBatch = await prisma.monitorScreenshotBatch.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends MonitorScreenshotBatchCreateManyArgs>(args?: SelectSubset<T, MonitorScreenshotBatchCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many MonitorScreenshotBatches and returns the data saved in the database.
     * @param {MonitorScreenshotBatchCreateManyAndReturnArgs} args - Arguments to create many MonitorScreenshotBatches.
     * @example
     * // Create many MonitorScreenshotBatches
     * const monitorScreenshotBatch = await prisma.monitorScreenshotBatch.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many MonitorScreenshotBatches and only return the `id`
     * const monitorScreenshotBatchWithIdOnly = await prisma.monitorScreenshotBatch.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends MonitorScreenshotBatchCreateManyAndReturnArgs>(args?: SelectSubset<T, MonitorScreenshotBatchCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MonitorScreenshotBatchPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a MonitorScreenshotBatch.
     * @param {MonitorScreenshotBatchDeleteArgs} args - Arguments to delete one MonitorScreenshotBatch.
     * @example
     * // Delete one MonitorScreenshotBatch
     * const MonitorScreenshotBatch = await prisma.monitorScreenshotBatch.delete({
     *   where: {
     *     // ... filter to delete one MonitorScreenshotBatch
     *   }
     * })
     * 
     */
    delete<T extends MonitorScreenshotBatchDeleteArgs>(args: SelectSubset<T, MonitorScreenshotBatchDeleteArgs<ExtArgs>>): Prisma__MonitorScreenshotBatchClient<$Result.GetResult<Prisma.$MonitorScreenshotBatchPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one MonitorScreenshotBatch.
     * @param {MonitorScreenshotBatchUpdateArgs} args - Arguments to update one MonitorScreenshotBatch.
     * @example
     * // Update one MonitorScreenshotBatch
     * const monitorScreenshotBatch = await prisma.monitorScreenshotBatch.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends MonitorScreenshotBatchUpdateArgs>(args: SelectSubset<T, MonitorScreenshotBatchUpdateArgs<ExtArgs>>): Prisma__MonitorScreenshotBatchClient<$Result.GetResult<Prisma.$MonitorScreenshotBatchPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more MonitorScreenshotBatches.
     * @param {MonitorScreenshotBatchDeleteManyArgs} args - Arguments to filter MonitorScreenshotBatches to delete.
     * @example
     * // Delete a few MonitorScreenshotBatches
     * const { count } = await prisma.monitorScreenshotBatch.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends MonitorScreenshotBatchDeleteManyArgs>(args?: SelectSubset<T, MonitorScreenshotBatchDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more MonitorScreenshotBatches.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MonitorScreenshotBatchUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many MonitorScreenshotBatches
     * const monitorScreenshotBatch = await prisma.monitorScreenshotBatch.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends MonitorScreenshotBatchUpdateManyArgs>(args: SelectSubset<T, MonitorScreenshotBatchUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more MonitorScreenshotBatches and returns the data updated in the database.
     * @param {MonitorScreenshotBatchUpdateManyAndReturnArgs} args - Arguments to update many MonitorScreenshotBatches.
     * @example
     * // Update many MonitorScreenshotBatches
     * const monitorScreenshotBatch = await prisma.monitorScreenshotBatch.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more MonitorScreenshotBatches and only return the `id`
     * const monitorScreenshotBatchWithIdOnly = await prisma.monitorScreenshotBatch.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends MonitorScreenshotBatchUpdateManyAndReturnArgs>(args: SelectSubset<T, MonitorScreenshotBatchUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MonitorScreenshotBatchPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one MonitorScreenshotBatch.
     * @param {MonitorScreenshotBatchUpsertArgs} args - Arguments to update or create a MonitorScreenshotBatch.
     * @example
     * // Update or create a MonitorScreenshotBatch
     * const monitorScreenshotBatch = await prisma.monitorScreenshotBatch.upsert({
     *   create: {
     *     // ... data to create a MonitorScreenshotBatch
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the MonitorScreenshotBatch we want to update
     *   }
     * })
     */
    upsert<T extends MonitorScreenshotBatchUpsertArgs>(args: SelectSubset<T, MonitorScreenshotBatchUpsertArgs<ExtArgs>>): Prisma__MonitorScreenshotBatchClient<$Result.GetResult<Prisma.$MonitorScreenshotBatchPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of MonitorScreenshotBatches.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MonitorScreenshotBatchCountArgs} args - Arguments to filter MonitorScreenshotBatches to count.
     * @example
     * // Count the number of MonitorScreenshotBatches
     * const count = await prisma.monitorScreenshotBatch.count({
     *   where: {
     *     // ... the filter for the MonitorScreenshotBatches we want to count
     *   }
     * })
    **/
    count<T extends MonitorScreenshotBatchCountArgs>(
      args?: Subset<T, MonitorScreenshotBatchCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], MonitorScreenshotBatchCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a MonitorScreenshotBatch.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MonitorScreenshotBatchAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends MonitorScreenshotBatchAggregateArgs>(args: Subset<T, MonitorScreenshotBatchAggregateArgs>): Prisma.PrismaPromise<GetMonitorScreenshotBatchAggregateType<T>>

    /**
     * Group by MonitorScreenshotBatch.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MonitorScreenshotBatchGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends MonitorScreenshotBatchGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: MonitorScreenshotBatchGroupByArgs['orderBy'] }
        : { orderBy?: MonitorScreenshotBatchGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, MonitorScreenshotBatchGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetMonitorScreenshotBatchGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the MonitorScreenshotBatch model
   */
  readonly fields: MonitorScreenshotBatchFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for MonitorScreenshotBatch.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__MonitorScreenshotBatchClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    screenshots<T extends MonitorScreenshotBatch$screenshotsArgs<ExtArgs> = {}>(args?: Subset<T, MonitorScreenshotBatch$screenshotsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MonitorScreenshotPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the MonitorScreenshotBatch model
   */
  interface MonitorScreenshotBatchFieldRefs {
    readonly id: FieldRef<"MonitorScreenshotBatch", 'String'>
    readonly organizationId: FieldRef<"MonitorScreenshotBatch", 'String'>
    readonly employeeId: FieldRef<"MonitorScreenshotBatch", 'String'>
    readonly deviceId: FieldRef<"MonitorScreenshotBatch", 'String'>
    readonly status: FieldRef<"MonitorScreenshotBatch", 'String'>
    readonly expectedCount: FieldRef<"MonitorScreenshotBatch", 'Int'>
    readonly uploadedCount: FieldRef<"MonitorScreenshotBatch", 'Int'>
    readonly duplicateCount: FieldRef<"MonitorScreenshotBatch", 'Int'>
    readonly expectedBytes: FieldRef<"MonitorScreenshotBatch", 'BigInt'>
    readonly uploadedBytes: FieldRef<"MonitorScreenshotBatch", 'BigInt'>
    readonly firstCapturedAt: FieldRef<"MonitorScreenshotBatch", 'DateTime'>
    readonly lastCapturedAt: FieldRef<"MonitorScreenshotBatch", 'DateTime'>
    readonly createdAt: FieldRef<"MonitorScreenshotBatch", 'DateTime'>
    readonly completedAt: FieldRef<"MonitorScreenshotBatch", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * MonitorScreenshotBatch findUnique
   */
  export type MonitorScreenshotBatchFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorScreenshotBatch
     */
    select?: MonitorScreenshotBatchSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorScreenshotBatch
     */
    omit?: MonitorScreenshotBatchOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MonitorScreenshotBatchInclude<ExtArgs> | null
    /**
     * Filter, which MonitorScreenshotBatch to fetch.
     */
    where: MonitorScreenshotBatchWhereUniqueInput
  }

  /**
   * MonitorScreenshotBatch findUniqueOrThrow
   */
  export type MonitorScreenshotBatchFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorScreenshotBatch
     */
    select?: MonitorScreenshotBatchSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorScreenshotBatch
     */
    omit?: MonitorScreenshotBatchOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MonitorScreenshotBatchInclude<ExtArgs> | null
    /**
     * Filter, which MonitorScreenshotBatch to fetch.
     */
    where: MonitorScreenshotBatchWhereUniqueInput
  }

  /**
   * MonitorScreenshotBatch findFirst
   */
  export type MonitorScreenshotBatchFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorScreenshotBatch
     */
    select?: MonitorScreenshotBatchSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorScreenshotBatch
     */
    omit?: MonitorScreenshotBatchOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MonitorScreenshotBatchInclude<ExtArgs> | null
    /**
     * Filter, which MonitorScreenshotBatch to fetch.
     */
    where?: MonitorScreenshotBatchWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MonitorScreenshotBatches to fetch.
     */
    orderBy?: MonitorScreenshotBatchOrderByWithRelationInput | MonitorScreenshotBatchOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for MonitorScreenshotBatches.
     */
    cursor?: MonitorScreenshotBatchWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MonitorScreenshotBatches from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MonitorScreenshotBatches.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of MonitorScreenshotBatches.
     */
    distinct?: MonitorScreenshotBatchScalarFieldEnum | MonitorScreenshotBatchScalarFieldEnum[]
  }

  /**
   * MonitorScreenshotBatch findFirstOrThrow
   */
  export type MonitorScreenshotBatchFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorScreenshotBatch
     */
    select?: MonitorScreenshotBatchSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorScreenshotBatch
     */
    omit?: MonitorScreenshotBatchOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MonitorScreenshotBatchInclude<ExtArgs> | null
    /**
     * Filter, which MonitorScreenshotBatch to fetch.
     */
    where?: MonitorScreenshotBatchWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MonitorScreenshotBatches to fetch.
     */
    orderBy?: MonitorScreenshotBatchOrderByWithRelationInput | MonitorScreenshotBatchOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for MonitorScreenshotBatches.
     */
    cursor?: MonitorScreenshotBatchWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MonitorScreenshotBatches from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MonitorScreenshotBatches.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of MonitorScreenshotBatches.
     */
    distinct?: MonitorScreenshotBatchScalarFieldEnum | MonitorScreenshotBatchScalarFieldEnum[]
  }

  /**
   * MonitorScreenshotBatch findMany
   */
  export type MonitorScreenshotBatchFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorScreenshotBatch
     */
    select?: MonitorScreenshotBatchSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorScreenshotBatch
     */
    omit?: MonitorScreenshotBatchOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MonitorScreenshotBatchInclude<ExtArgs> | null
    /**
     * Filter, which MonitorScreenshotBatches to fetch.
     */
    where?: MonitorScreenshotBatchWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MonitorScreenshotBatches to fetch.
     */
    orderBy?: MonitorScreenshotBatchOrderByWithRelationInput | MonitorScreenshotBatchOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing MonitorScreenshotBatches.
     */
    cursor?: MonitorScreenshotBatchWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MonitorScreenshotBatches from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MonitorScreenshotBatches.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of MonitorScreenshotBatches.
     */
    distinct?: MonitorScreenshotBatchScalarFieldEnum | MonitorScreenshotBatchScalarFieldEnum[]
  }

  /**
   * MonitorScreenshotBatch create
   */
  export type MonitorScreenshotBatchCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorScreenshotBatch
     */
    select?: MonitorScreenshotBatchSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorScreenshotBatch
     */
    omit?: MonitorScreenshotBatchOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MonitorScreenshotBatchInclude<ExtArgs> | null
    /**
     * The data needed to create a MonitorScreenshotBatch.
     */
    data: XOR<MonitorScreenshotBatchCreateInput, MonitorScreenshotBatchUncheckedCreateInput>
  }

  /**
   * MonitorScreenshotBatch createMany
   */
  export type MonitorScreenshotBatchCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many MonitorScreenshotBatches.
     */
    data: MonitorScreenshotBatchCreateManyInput | MonitorScreenshotBatchCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * MonitorScreenshotBatch createManyAndReturn
   */
  export type MonitorScreenshotBatchCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorScreenshotBatch
     */
    select?: MonitorScreenshotBatchSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorScreenshotBatch
     */
    omit?: MonitorScreenshotBatchOmit<ExtArgs> | null
    /**
     * The data used to create many MonitorScreenshotBatches.
     */
    data: MonitorScreenshotBatchCreateManyInput | MonitorScreenshotBatchCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * MonitorScreenshotBatch update
   */
  export type MonitorScreenshotBatchUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorScreenshotBatch
     */
    select?: MonitorScreenshotBatchSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorScreenshotBatch
     */
    omit?: MonitorScreenshotBatchOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MonitorScreenshotBatchInclude<ExtArgs> | null
    /**
     * The data needed to update a MonitorScreenshotBatch.
     */
    data: XOR<MonitorScreenshotBatchUpdateInput, MonitorScreenshotBatchUncheckedUpdateInput>
    /**
     * Choose, which MonitorScreenshotBatch to update.
     */
    where: MonitorScreenshotBatchWhereUniqueInput
  }

  /**
   * MonitorScreenshotBatch updateMany
   */
  export type MonitorScreenshotBatchUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update MonitorScreenshotBatches.
     */
    data: XOR<MonitorScreenshotBatchUpdateManyMutationInput, MonitorScreenshotBatchUncheckedUpdateManyInput>
    /**
     * Filter which MonitorScreenshotBatches to update
     */
    where?: MonitorScreenshotBatchWhereInput
    /**
     * Limit how many MonitorScreenshotBatches to update.
     */
    limit?: number
  }

  /**
   * MonitorScreenshotBatch updateManyAndReturn
   */
  export type MonitorScreenshotBatchUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorScreenshotBatch
     */
    select?: MonitorScreenshotBatchSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorScreenshotBatch
     */
    omit?: MonitorScreenshotBatchOmit<ExtArgs> | null
    /**
     * The data used to update MonitorScreenshotBatches.
     */
    data: XOR<MonitorScreenshotBatchUpdateManyMutationInput, MonitorScreenshotBatchUncheckedUpdateManyInput>
    /**
     * Filter which MonitorScreenshotBatches to update
     */
    where?: MonitorScreenshotBatchWhereInput
    /**
     * Limit how many MonitorScreenshotBatches to update.
     */
    limit?: number
  }

  /**
   * MonitorScreenshotBatch upsert
   */
  export type MonitorScreenshotBatchUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorScreenshotBatch
     */
    select?: MonitorScreenshotBatchSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorScreenshotBatch
     */
    omit?: MonitorScreenshotBatchOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MonitorScreenshotBatchInclude<ExtArgs> | null
    /**
     * The filter to search for the MonitorScreenshotBatch to update in case it exists.
     */
    where: MonitorScreenshotBatchWhereUniqueInput
    /**
     * In case the MonitorScreenshotBatch found by the `where` argument doesn't exist, create a new MonitorScreenshotBatch with this data.
     */
    create: XOR<MonitorScreenshotBatchCreateInput, MonitorScreenshotBatchUncheckedCreateInput>
    /**
     * In case the MonitorScreenshotBatch was found with the provided `where` argument, update it with this data.
     */
    update: XOR<MonitorScreenshotBatchUpdateInput, MonitorScreenshotBatchUncheckedUpdateInput>
  }

  /**
   * MonitorScreenshotBatch delete
   */
  export type MonitorScreenshotBatchDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorScreenshotBatch
     */
    select?: MonitorScreenshotBatchSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorScreenshotBatch
     */
    omit?: MonitorScreenshotBatchOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MonitorScreenshotBatchInclude<ExtArgs> | null
    /**
     * Filter which MonitorScreenshotBatch to delete.
     */
    where: MonitorScreenshotBatchWhereUniqueInput
  }

  /**
   * MonitorScreenshotBatch deleteMany
   */
  export type MonitorScreenshotBatchDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which MonitorScreenshotBatches to delete
     */
    where?: MonitorScreenshotBatchWhereInput
    /**
     * Limit how many MonitorScreenshotBatches to delete.
     */
    limit?: number
  }

  /**
   * MonitorScreenshotBatch.screenshots
   */
  export type MonitorScreenshotBatch$screenshotsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorScreenshot
     */
    select?: MonitorScreenshotSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorScreenshot
     */
    omit?: MonitorScreenshotOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MonitorScreenshotInclude<ExtArgs> | null
    where?: MonitorScreenshotWhereInput
    orderBy?: MonitorScreenshotOrderByWithRelationInput | MonitorScreenshotOrderByWithRelationInput[]
    cursor?: MonitorScreenshotWhereUniqueInput
    take?: number
    skip?: number
    distinct?: MonitorScreenshotScalarFieldEnum | MonitorScreenshotScalarFieldEnum[]
  }

  /**
   * MonitorScreenshotBatch without action
   */
  export type MonitorScreenshotBatchDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorScreenshotBatch
     */
    select?: MonitorScreenshotBatchSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorScreenshotBatch
     */
    omit?: MonitorScreenshotBatchOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MonitorScreenshotBatchInclude<ExtArgs> | null
  }


  /**
   * Model MonitorScreenshot
   */

  export type AggregateMonitorScreenshot = {
    _count: MonitorScreenshotCountAggregateOutputType | null
    _avg: MonitorScreenshotAvgAggregateOutputType | null
    _sum: MonitorScreenshotSumAggregateOutputType | null
    _min: MonitorScreenshotMinAggregateOutputType | null
    _max: MonitorScreenshotMaxAggregateOutputType | null
  }

  export type MonitorScreenshotAvgAggregateOutputType = {
    width: number | null
    height: number | null
    sizeBytes: number | null
    cloudinaryVersion: number | null
  }

  export type MonitorScreenshotSumAggregateOutputType = {
    width: number | null
    height: number | null
    sizeBytes: bigint | null
    cloudinaryVersion: bigint | null
  }

  export type MonitorScreenshotMinAggregateOutputType = {
    id: string | null
    batchId: string | null
    organizationId: string | null
    employeeId: string | null
    deviceId: string | null
    clientScreenshotId: string | null
    capturedAt: Date | null
    originalFileName: string | null
    mimeType: string | null
    width: number | null
    height: number | null
    sha256: string | null
    sizeBytes: bigint | null
    cloudinaryFolder: string | null
    cloudinaryPublicId: string | null
    cloudinaryAssetId: string | null
    cloudinaryVersion: bigint | null
    cloudinaryFormat: string | null
    cloudinaryUrl: string | null
    duplicateOf: string | null
    uploadStatus: string | null
    processingStatus: string | null
    errorMessage: string | null
    createdAt: Date | null
    uploadedAt: Date | null
  }

  export type MonitorScreenshotMaxAggregateOutputType = {
    id: string | null
    batchId: string | null
    organizationId: string | null
    employeeId: string | null
    deviceId: string | null
    clientScreenshotId: string | null
    capturedAt: Date | null
    originalFileName: string | null
    mimeType: string | null
    width: number | null
    height: number | null
    sha256: string | null
    sizeBytes: bigint | null
    cloudinaryFolder: string | null
    cloudinaryPublicId: string | null
    cloudinaryAssetId: string | null
    cloudinaryVersion: bigint | null
    cloudinaryFormat: string | null
    cloudinaryUrl: string | null
    duplicateOf: string | null
    uploadStatus: string | null
    processingStatus: string | null
    errorMessage: string | null
    createdAt: Date | null
    uploadedAt: Date | null
  }

  export type MonitorScreenshotCountAggregateOutputType = {
    id: number
    batchId: number
    organizationId: number
    employeeId: number
    deviceId: number
    clientScreenshotId: number
    capturedAt: number
    originalFileName: number
    mimeType: number
    width: number
    height: number
    sha256: number
    sizeBytes: number
    cloudinaryFolder: number
    cloudinaryPublicId: number
    cloudinaryAssetId: number
    cloudinaryVersion: number
    cloudinaryFormat: number
    cloudinaryUrl: number
    duplicateOf: number
    uploadStatus: number
    processingStatus: number
    errorMessage: number
    createdAt: number
    uploadedAt: number
    _all: number
  }


  export type MonitorScreenshotAvgAggregateInputType = {
    width?: true
    height?: true
    sizeBytes?: true
    cloudinaryVersion?: true
  }

  export type MonitorScreenshotSumAggregateInputType = {
    width?: true
    height?: true
    sizeBytes?: true
    cloudinaryVersion?: true
  }

  export type MonitorScreenshotMinAggregateInputType = {
    id?: true
    batchId?: true
    organizationId?: true
    employeeId?: true
    deviceId?: true
    clientScreenshotId?: true
    capturedAt?: true
    originalFileName?: true
    mimeType?: true
    width?: true
    height?: true
    sha256?: true
    sizeBytes?: true
    cloudinaryFolder?: true
    cloudinaryPublicId?: true
    cloudinaryAssetId?: true
    cloudinaryVersion?: true
    cloudinaryFormat?: true
    cloudinaryUrl?: true
    duplicateOf?: true
    uploadStatus?: true
    processingStatus?: true
    errorMessage?: true
    createdAt?: true
    uploadedAt?: true
  }

  export type MonitorScreenshotMaxAggregateInputType = {
    id?: true
    batchId?: true
    organizationId?: true
    employeeId?: true
    deviceId?: true
    clientScreenshotId?: true
    capturedAt?: true
    originalFileName?: true
    mimeType?: true
    width?: true
    height?: true
    sha256?: true
    sizeBytes?: true
    cloudinaryFolder?: true
    cloudinaryPublicId?: true
    cloudinaryAssetId?: true
    cloudinaryVersion?: true
    cloudinaryFormat?: true
    cloudinaryUrl?: true
    duplicateOf?: true
    uploadStatus?: true
    processingStatus?: true
    errorMessage?: true
    createdAt?: true
    uploadedAt?: true
  }

  export type MonitorScreenshotCountAggregateInputType = {
    id?: true
    batchId?: true
    organizationId?: true
    employeeId?: true
    deviceId?: true
    clientScreenshotId?: true
    capturedAt?: true
    originalFileName?: true
    mimeType?: true
    width?: true
    height?: true
    sha256?: true
    sizeBytes?: true
    cloudinaryFolder?: true
    cloudinaryPublicId?: true
    cloudinaryAssetId?: true
    cloudinaryVersion?: true
    cloudinaryFormat?: true
    cloudinaryUrl?: true
    duplicateOf?: true
    uploadStatus?: true
    processingStatus?: true
    errorMessage?: true
    createdAt?: true
    uploadedAt?: true
    _all?: true
  }

  export type MonitorScreenshotAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which MonitorScreenshot to aggregate.
     */
    where?: MonitorScreenshotWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MonitorScreenshots to fetch.
     */
    orderBy?: MonitorScreenshotOrderByWithRelationInput | MonitorScreenshotOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: MonitorScreenshotWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MonitorScreenshots from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MonitorScreenshots.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned MonitorScreenshots
    **/
    _count?: true | MonitorScreenshotCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: MonitorScreenshotAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: MonitorScreenshotSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: MonitorScreenshotMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: MonitorScreenshotMaxAggregateInputType
  }

  export type GetMonitorScreenshotAggregateType<T extends MonitorScreenshotAggregateArgs> = {
        [P in keyof T & keyof AggregateMonitorScreenshot]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateMonitorScreenshot[P]>
      : GetScalarType<T[P], AggregateMonitorScreenshot[P]>
  }




  export type MonitorScreenshotGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: MonitorScreenshotWhereInput
    orderBy?: MonitorScreenshotOrderByWithAggregationInput | MonitorScreenshotOrderByWithAggregationInput[]
    by: MonitorScreenshotScalarFieldEnum[] | MonitorScreenshotScalarFieldEnum
    having?: MonitorScreenshotScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: MonitorScreenshotCountAggregateInputType | true
    _avg?: MonitorScreenshotAvgAggregateInputType
    _sum?: MonitorScreenshotSumAggregateInputType
    _min?: MonitorScreenshotMinAggregateInputType
    _max?: MonitorScreenshotMaxAggregateInputType
  }

  export type MonitorScreenshotGroupByOutputType = {
    id: string
    batchId: string | null
    organizationId: string | null
    employeeId: string
    deviceId: string
    clientScreenshotId: string
    capturedAt: Date
    originalFileName: string
    mimeType: string
    width: number | null
    height: number | null
    sha256: string
    sizeBytes: bigint
    cloudinaryFolder: string | null
    cloudinaryPublicId: string | null
    cloudinaryAssetId: string | null
    cloudinaryVersion: bigint | null
    cloudinaryFormat: string | null
    cloudinaryUrl: string | null
    duplicateOf: string | null
    uploadStatus: string
    processingStatus: string
    errorMessage: string | null
    createdAt: Date
    uploadedAt: Date | null
    _count: MonitorScreenshotCountAggregateOutputType | null
    _avg: MonitorScreenshotAvgAggregateOutputType | null
    _sum: MonitorScreenshotSumAggregateOutputType | null
    _min: MonitorScreenshotMinAggregateOutputType | null
    _max: MonitorScreenshotMaxAggregateOutputType | null
  }

  type GetMonitorScreenshotGroupByPayload<T extends MonitorScreenshotGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<MonitorScreenshotGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof MonitorScreenshotGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], MonitorScreenshotGroupByOutputType[P]>
            : GetScalarType<T[P], MonitorScreenshotGroupByOutputType[P]>
        }
      >
    >


  export type MonitorScreenshotSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    batchId?: boolean
    organizationId?: boolean
    employeeId?: boolean
    deviceId?: boolean
    clientScreenshotId?: boolean
    capturedAt?: boolean
    originalFileName?: boolean
    mimeType?: boolean
    width?: boolean
    height?: boolean
    sha256?: boolean
    sizeBytes?: boolean
    cloudinaryFolder?: boolean
    cloudinaryPublicId?: boolean
    cloudinaryAssetId?: boolean
    cloudinaryVersion?: boolean
    cloudinaryFormat?: boolean
    cloudinaryUrl?: boolean
    duplicateOf?: boolean
    uploadStatus?: boolean
    processingStatus?: boolean
    errorMessage?: boolean
    createdAt?: boolean
    uploadedAt?: boolean
    batch?: boolean | MonitorScreenshot$batchArgs<ExtArgs>
  }, ExtArgs["result"]["monitorScreenshot"]>

  export type MonitorScreenshotSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    batchId?: boolean
    organizationId?: boolean
    employeeId?: boolean
    deviceId?: boolean
    clientScreenshotId?: boolean
    capturedAt?: boolean
    originalFileName?: boolean
    mimeType?: boolean
    width?: boolean
    height?: boolean
    sha256?: boolean
    sizeBytes?: boolean
    cloudinaryFolder?: boolean
    cloudinaryPublicId?: boolean
    cloudinaryAssetId?: boolean
    cloudinaryVersion?: boolean
    cloudinaryFormat?: boolean
    cloudinaryUrl?: boolean
    duplicateOf?: boolean
    uploadStatus?: boolean
    processingStatus?: boolean
    errorMessage?: boolean
    createdAt?: boolean
    uploadedAt?: boolean
    batch?: boolean | MonitorScreenshot$batchArgs<ExtArgs>
  }, ExtArgs["result"]["monitorScreenshot"]>

  export type MonitorScreenshotSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    batchId?: boolean
    organizationId?: boolean
    employeeId?: boolean
    deviceId?: boolean
    clientScreenshotId?: boolean
    capturedAt?: boolean
    originalFileName?: boolean
    mimeType?: boolean
    width?: boolean
    height?: boolean
    sha256?: boolean
    sizeBytes?: boolean
    cloudinaryFolder?: boolean
    cloudinaryPublicId?: boolean
    cloudinaryAssetId?: boolean
    cloudinaryVersion?: boolean
    cloudinaryFormat?: boolean
    cloudinaryUrl?: boolean
    duplicateOf?: boolean
    uploadStatus?: boolean
    processingStatus?: boolean
    errorMessage?: boolean
    createdAt?: boolean
    uploadedAt?: boolean
    batch?: boolean | MonitorScreenshot$batchArgs<ExtArgs>
  }, ExtArgs["result"]["monitorScreenshot"]>

  export type MonitorScreenshotSelectScalar = {
    id?: boolean
    batchId?: boolean
    organizationId?: boolean
    employeeId?: boolean
    deviceId?: boolean
    clientScreenshotId?: boolean
    capturedAt?: boolean
    originalFileName?: boolean
    mimeType?: boolean
    width?: boolean
    height?: boolean
    sha256?: boolean
    sizeBytes?: boolean
    cloudinaryFolder?: boolean
    cloudinaryPublicId?: boolean
    cloudinaryAssetId?: boolean
    cloudinaryVersion?: boolean
    cloudinaryFormat?: boolean
    cloudinaryUrl?: boolean
    duplicateOf?: boolean
    uploadStatus?: boolean
    processingStatus?: boolean
    errorMessage?: boolean
    createdAt?: boolean
    uploadedAt?: boolean
  }

  export type MonitorScreenshotOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "batchId" | "organizationId" | "employeeId" | "deviceId" | "clientScreenshotId" | "capturedAt" | "originalFileName" | "mimeType" | "width" | "height" | "sha256" | "sizeBytes" | "cloudinaryFolder" | "cloudinaryPublicId" | "cloudinaryAssetId" | "cloudinaryVersion" | "cloudinaryFormat" | "cloudinaryUrl" | "duplicateOf" | "uploadStatus" | "processingStatus" | "errorMessage" | "createdAt" | "uploadedAt", ExtArgs["result"]["monitorScreenshot"]>
  export type MonitorScreenshotInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    batch?: boolean | MonitorScreenshot$batchArgs<ExtArgs>
  }
  export type MonitorScreenshotIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    batch?: boolean | MonitorScreenshot$batchArgs<ExtArgs>
  }
  export type MonitorScreenshotIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    batch?: boolean | MonitorScreenshot$batchArgs<ExtArgs>
  }

  export type $MonitorScreenshotPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "MonitorScreenshot"
    objects: {
      batch: Prisma.$MonitorScreenshotBatchPayload<ExtArgs> | null
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      batchId: string | null
      organizationId: string | null
      employeeId: string
      deviceId: string
      clientScreenshotId: string
      capturedAt: Date
      originalFileName: string
      mimeType: string
      width: number | null
      height: number | null
      sha256: string
      sizeBytes: bigint
      cloudinaryFolder: string | null
      cloudinaryPublicId: string | null
      cloudinaryAssetId: string | null
      cloudinaryVersion: bigint | null
      cloudinaryFormat: string | null
      cloudinaryUrl: string | null
      duplicateOf: string | null
      uploadStatus: string
      processingStatus: string
      errorMessage: string | null
      createdAt: Date
      uploadedAt: Date | null
    }, ExtArgs["result"]["monitorScreenshot"]>
    composites: {}
  }

  type MonitorScreenshotGetPayload<S extends boolean | null | undefined | MonitorScreenshotDefaultArgs> = $Result.GetResult<Prisma.$MonitorScreenshotPayload, S>

  type MonitorScreenshotCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<MonitorScreenshotFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: MonitorScreenshotCountAggregateInputType | true
    }

  export interface MonitorScreenshotDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['MonitorScreenshot'], meta: { name: 'MonitorScreenshot' } }
    /**
     * Find zero or one MonitorScreenshot that matches the filter.
     * @param {MonitorScreenshotFindUniqueArgs} args - Arguments to find a MonitorScreenshot
     * @example
     * // Get one MonitorScreenshot
     * const monitorScreenshot = await prisma.monitorScreenshot.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends MonitorScreenshotFindUniqueArgs>(args: SelectSubset<T, MonitorScreenshotFindUniqueArgs<ExtArgs>>): Prisma__MonitorScreenshotClient<$Result.GetResult<Prisma.$MonitorScreenshotPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one MonitorScreenshot that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {MonitorScreenshotFindUniqueOrThrowArgs} args - Arguments to find a MonitorScreenshot
     * @example
     * // Get one MonitorScreenshot
     * const monitorScreenshot = await prisma.monitorScreenshot.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends MonitorScreenshotFindUniqueOrThrowArgs>(args: SelectSubset<T, MonitorScreenshotFindUniqueOrThrowArgs<ExtArgs>>): Prisma__MonitorScreenshotClient<$Result.GetResult<Prisma.$MonitorScreenshotPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first MonitorScreenshot that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MonitorScreenshotFindFirstArgs} args - Arguments to find a MonitorScreenshot
     * @example
     * // Get one MonitorScreenshot
     * const monitorScreenshot = await prisma.monitorScreenshot.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends MonitorScreenshotFindFirstArgs>(args?: SelectSubset<T, MonitorScreenshotFindFirstArgs<ExtArgs>>): Prisma__MonitorScreenshotClient<$Result.GetResult<Prisma.$MonitorScreenshotPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first MonitorScreenshot that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MonitorScreenshotFindFirstOrThrowArgs} args - Arguments to find a MonitorScreenshot
     * @example
     * // Get one MonitorScreenshot
     * const monitorScreenshot = await prisma.monitorScreenshot.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends MonitorScreenshotFindFirstOrThrowArgs>(args?: SelectSubset<T, MonitorScreenshotFindFirstOrThrowArgs<ExtArgs>>): Prisma__MonitorScreenshotClient<$Result.GetResult<Prisma.$MonitorScreenshotPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more MonitorScreenshots that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MonitorScreenshotFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all MonitorScreenshots
     * const monitorScreenshots = await prisma.monitorScreenshot.findMany()
     * 
     * // Get first 10 MonitorScreenshots
     * const monitorScreenshots = await prisma.monitorScreenshot.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const monitorScreenshotWithIdOnly = await prisma.monitorScreenshot.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends MonitorScreenshotFindManyArgs>(args?: SelectSubset<T, MonitorScreenshotFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MonitorScreenshotPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a MonitorScreenshot.
     * @param {MonitorScreenshotCreateArgs} args - Arguments to create a MonitorScreenshot.
     * @example
     * // Create one MonitorScreenshot
     * const MonitorScreenshot = await prisma.monitorScreenshot.create({
     *   data: {
     *     // ... data to create a MonitorScreenshot
     *   }
     * })
     * 
     */
    create<T extends MonitorScreenshotCreateArgs>(args: SelectSubset<T, MonitorScreenshotCreateArgs<ExtArgs>>): Prisma__MonitorScreenshotClient<$Result.GetResult<Prisma.$MonitorScreenshotPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many MonitorScreenshots.
     * @param {MonitorScreenshotCreateManyArgs} args - Arguments to create many MonitorScreenshots.
     * @example
     * // Create many MonitorScreenshots
     * const monitorScreenshot = await prisma.monitorScreenshot.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends MonitorScreenshotCreateManyArgs>(args?: SelectSubset<T, MonitorScreenshotCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many MonitorScreenshots and returns the data saved in the database.
     * @param {MonitorScreenshotCreateManyAndReturnArgs} args - Arguments to create many MonitorScreenshots.
     * @example
     * // Create many MonitorScreenshots
     * const monitorScreenshot = await prisma.monitorScreenshot.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many MonitorScreenshots and only return the `id`
     * const monitorScreenshotWithIdOnly = await prisma.monitorScreenshot.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends MonitorScreenshotCreateManyAndReturnArgs>(args?: SelectSubset<T, MonitorScreenshotCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MonitorScreenshotPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a MonitorScreenshot.
     * @param {MonitorScreenshotDeleteArgs} args - Arguments to delete one MonitorScreenshot.
     * @example
     * // Delete one MonitorScreenshot
     * const MonitorScreenshot = await prisma.monitorScreenshot.delete({
     *   where: {
     *     // ... filter to delete one MonitorScreenshot
     *   }
     * })
     * 
     */
    delete<T extends MonitorScreenshotDeleteArgs>(args: SelectSubset<T, MonitorScreenshotDeleteArgs<ExtArgs>>): Prisma__MonitorScreenshotClient<$Result.GetResult<Prisma.$MonitorScreenshotPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one MonitorScreenshot.
     * @param {MonitorScreenshotUpdateArgs} args - Arguments to update one MonitorScreenshot.
     * @example
     * // Update one MonitorScreenshot
     * const monitorScreenshot = await prisma.monitorScreenshot.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends MonitorScreenshotUpdateArgs>(args: SelectSubset<T, MonitorScreenshotUpdateArgs<ExtArgs>>): Prisma__MonitorScreenshotClient<$Result.GetResult<Prisma.$MonitorScreenshotPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more MonitorScreenshots.
     * @param {MonitorScreenshotDeleteManyArgs} args - Arguments to filter MonitorScreenshots to delete.
     * @example
     * // Delete a few MonitorScreenshots
     * const { count } = await prisma.monitorScreenshot.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends MonitorScreenshotDeleteManyArgs>(args?: SelectSubset<T, MonitorScreenshotDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more MonitorScreenshots.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MonitorScreenshotUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many MonitorScreenshots
     * const monitorScreenshot = await prisma.monitorScreenshot.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends MonitorScreenshotUpdateManyArgs>(args: SelectSubset<T, MonitorScreenshotUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more MonitorScreenshots and returns the data updated in the database.
     * @param {MonitorScreenshotUpdateManyAndReturnArgs} args - Arguments to update many MonitorScreenshots.
     * @example
     * // Update many MonitorScreenshots
     * const monitorScreenshot = await prisma.monitorScreenshot.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more MonitorScreenshots and only return the `id`
     * const monitorScreenshotWithIdOnly = await prisma.monitorScreenshot.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends MonitorScreenshotUpdateManyAndReturnArgs>(args: SelectSubset<T, MonitorScreenshotUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MonitorScreenshotPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one MonitorScreenshot.
     * @param {MonitorScreenshotUpsertArgs} args - Arguments to update or create a MonitorScreenshot.
     * @example
     * // Update or create a MonitorScreenshot
     * const monitorScreenshot = await prisma.monitorScreenshot.upsert({
     *   create: {
     *     // ... data to create a MonitorScreenshot
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the MonitorScreenshot we want to update
     *   }
     * })
     */
    upsert<T extends MonitorScreenshotUpsertArgs>(args: SelectSubset<T, MonitorScreenshotUpsertArgs<ExtArgs>>): Prisma__MonitorScreenshotClient<$Result.GetResult<Prisma.$MonitorScreenshotPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of MonitorScreenshots.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MonitorScreenshotCountArgs} args - Arguments to filter MonitorScreenshots to count.
     * @example
     * // Count the number of MonitorScreenshots
     * const count = await prisma.monitorScreenshot.count({
     *   where: {
     *     // ... the filter for the MonitorScreenshots we want to count
     *   }
     * })
    **/
    count<T extends MonitorScreenshotCountArgs>(
      args?: Subset<T, MonitorScreenshotCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], MonitorScreenshotCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a MonitorScreenshot.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MonitorScreenshotAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends MonitorScreenshotAggregateArgs>(args: Subset<T, MonitorScreenshotAggregateArgs>): Prisma.PrismaPromise<GetMonitorScreenshotAggregateType<T>>

    /**
     * Group by MonitorScreenshot.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MonitorScreenshotGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends MonitorScreenshotGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: MonitorScreenshotGroupByArgs['orderBy'] }
        : { orderBy?: MonitorScreenshotGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, MonitorScreenshotGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetMonitorScreenshotGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the MonitorScreenshot model
   */
  readonly fields: MonitorScreenshotFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for MonitorScreenshot.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__MonitorScreenshotClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    batch<T extends MonitorScreenshot$batchArgs<ExtArgs> = {}>(args?: Subset<T, MonitorScreenshot$batchArgs<ExtArgs>>): Prisma__MonitorScreenshotBatchClient<$Result.GetResult<Prisma.$MonitorScreenshotBatchPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the MonitorScreenshot model
   */
  interface MonitorScreenshotFieldRefs {
    readonly id: FieldRef<"MonitorScreenshot", 'String'>
    readonly batchId: FieldRef<"MonitorScreenshot", 'String'>
    readonly organizationId: FieldRef<"MonitorScreenshot", 'String'>
    readonly employeeId: FieldRef<"MonitorScreenshot", 'String'>
    readonly deviceId: FieldRef<"MonitorScreenshot", 'String'>
    readonly clientScreenshotId: FieldRef<"MonitorScreenshot", 'String'>
    readonly capturedAt: FieldRef<"MonitorScreenshot", 'DateTime'>
    readonly originalFileName: FieldRef<"MonitorScreenshot", 'String'>
    readonly mimeType: FieldRef<"MonitorScreenshot", 'String'>
    readonly width: FieldRef<"MonitorScreenshot", 'Int'>
    readonly height: FieldRef<"MonitorScreenshot", 'Int'>
    readonly sha256: FieldRef<"MonitorScreenshot", 'String'>
    readonly sizeBytes: FieldRef<"MonitorScreenshot", 'BigInt'>
    readonly cloudinaryFolder: FieldRef<"MonitorScreenshot", 'String'>
    readonly cloudinaryPublicId: FieldRef<"MonitorScreenshot", 'String'>
    readonly cloudinaryAssetId: FieldRef<"MonitorScreenshot", 'String'>
    readonly cloudinaryVersion: FieldRef<"MonitorScreenshot", 'BigInt'>
    readonly cloudinaryFormat: FieldRef<"MonitorScreenshot", 'String'>
    readonly cloudinaryUrl: FieldRef<"MonitorScreenshot", 'String'>
    readonly duplicateOf: FieldRef<"MonitorScreenshot", 'String'>
    readonly uploadStatus: FieldRef<"MonitorScreenshot", 'String'>
    readonly processingStatus: FieldRef<"MonitorScreenshot", 'String'>
    readonly errorMessage: FieldRef<"MonitorScreenshot", 'String'>
    readonly createdAt: FieldRef<"MonitorScreenshot", 'DateTime'>
    readonly uploadedAt: FieldRef<"MonitorScreenshot", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * MonitorScreenshot findUnique
   */
  export type MonitorScreenshotFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorScreenshot
     */
    select?: MonitorScreenshotSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorScreenshot
     */
    omit?: MonitorScreenshotOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MonitorScreenshotInclude<ExtArgs> | null
    /**
     * Filter, which MonitorScreenshot to fetch.
     */
    where: MonitorScreenshotWhereUniqueInput
  }

  /**
   * MonitorScreenshot findUniqueOrThrow
   */
  export type MonitorScreenshotFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorScreenshot
     */
    select?: MonitorScreenshotSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorScreenshot
     */
    omit?: MonitorScreenshotOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MonitorScreenshotInclude<ExtArgs> | null
    /**
     * Filter, which MonitorScreenshot to fetch.
     */
    where: MonitorScreenshotWhereUniqueInput
  }

  /**
   * MonitorScreenshot findFirst
   */
  export type MonitorScreenshotFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorScreenshot
     */
    select?: MonitorScreenshotSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorScreenshot
     */
    omit?: MonitorScreenshotOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MonitorScreenshotInclude<ExtArgs> | null
    /**
     * Filter, which MonitorScreenshot to fetch.
     */
    where?: MonitorScreenshotWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MonitorScreenshots to fetch.
     */
    orderBy?: MonitorScreenshotOrderByWithRelationInput | MonitorScreenshotOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for MonitorScreenshots.
     */
    cursor?: MonitorScreenshotWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MonitorScreenshots from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MonitorScreenshots.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of MonitorScreenshots.
     */
    distinct?: MonitorScreenshotScalarFieldEnum | MonitorScreenshotScalarFieldEnum[]
  }

  /**
   * MonitorScreenshot findFirstOrThrow
   */
  export type MonitorScreenshotFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorScreenshot
     */
    select?: MonitorScreenshotSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorScreenshot
     */
    omit?: MonitorScreenshotOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MonitorScreenshotInclude<ExtArgs> | null
    /**
     * Filter, which MonitorScreenshot to fetch.
     */
    where?: MonitorScreenshotWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MonitorScreenshots to fetch.
     */
    orderBy?: MonitorScreenshotOrderByWithRelationInput | MonitorScreenshotOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for MonitorScreenshots.
     */
    cursor?: MonitorScreenshotWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MonitorScreenshots from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MonitorScreenshots.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of MonitorScreenshots.
     */
    distinct?: MonitorScreenshotScalarFieldEnum | MonitorScreenshotScalarFieldEnum[]
  }

  /**
   * MonitorScreenshot findMany
   */
  export type MonitorScreenshotFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorScreenshot
     */
    select?: MonitorScreenshotSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorScreenshot
     */
    omit?: MonitorScreenshotOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MonitorScreenshotInclude<ExtArgs> | null
    /**
     * Filter, which MonitorScreenshots to fetch.
     */
    where?: MonitorScreenshotWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MonitorScreenshots to fetch.
     */
    orderBy?: MonitorScreenshotOrderByWithRelationInput | MonitorScreenshotOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing MonitorScreenshots.
     */
    cursor?: MonitorScreenshotWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MonitorScreenshots from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MonitorScreenshots.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of MonitorScreenshots.
     */
    distinct?: MonitorScreenshotScalarFieldEnum | MonitorScreenshotScalarFieldEnum[]
  }

  /**
   * MonitorScreenshot create
   */
  export type MonitorScreenshotCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorScreenshot
     */
    select?: MonitorScreenshotSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorScreenshot
     */
    omit?: MonitorScreenshotOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MonitorScreenshotInclude<ExtArgs> | null
    /**
     * The data needed to create a MonitorScreenshot.
     */
    data: XOR<MonitorScreenshotCreateInput, MonitorScreenshotUncheckedCreateInput>
  }

  /**
   * MonitorScreenshot createMany
   */
  export type MonitorScreenshotCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many MonitorScreenshots.
     */
    data: MonitorScreenshotCreateManyInput | MonitorScreenshotCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * MonitorScreenshot createManyAndReturn
   */
  export type MonitorScreenshotCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorScreenshot
     */
    select?: MonitorScreenshotSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorScreenshot
     */
    omit?: MonitorScreenshotOmit<ExtArgs> | null
    /**
     * The data used to create many MonitorScreenshots.
     */
    data: MonitorScreenshotCreateManyInput | MonitorScreenshotCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MonitorScreenshotIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * MonitorScreenshot update
   */
  export type MonitorScreenshotUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorScreenshot
     */
    select?: MonitorScreenshotSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorScreenshot
     */
    omit?: MonitorScreenshotOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MonitorScreenshotInclude<ExtArgs> | null
    /**
     * The data needed to update a MonitorScreenshot.
     */
    data: XOR<MonitorScreenshotUpdateInput, MonitorScreenshotUncheckedUpdateInput>
    /**
     * Choose, which MonitorScreenshot to update.
     */
    where: MonitorScreenshotWhereUniqueInput
  }

  /**
   * MonitorScreenshot updateMany
   */
  export type MonitorScreenshotUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update MonitorScreenshots.
     */
    data: XOR<MonitorScreenshotUpdateManyMutationInput, MonitorScreenshotUncheckedUpdateManyInput>
    /**
     * Filter which MonitorScreenshots to update
     */
    where?: MonitorScreenshotWhereInput
    /**
     * Limit how many MonitorScreenshots to update.
     */
    limit?: number
  }

  /**
   * MonitorScreenshot updateManyAndReturn
   */
  export type MonitorScreenshotUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorScreenshot
     */
    select?: MonitorScreenshotSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorScreenshot
     */
    omit?: MonitorScreenshotOmit<ExtArgs> | null
    /**
     * The data used to update MonitorScreenshots.
     */
    data: XOR<MonitorScreenshotUpdateManyMutationInput, MonitorScreenshotUncheckedUpdateManyInput>
    /**
     * Filter which MonitorScreenshots to update
     */
    where?: MonitorScreenshotWhereInput
    /**
     * Limit how many MonitorScreenshots to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MonitorScreenshotIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * MonitorScreenshot upsert
   */
  export type MonitorScreenshotUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorScreenshot
     */
    select?: MonitorScreenshotSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorScreenshot
     */
    omit?: MonitorScreenshotOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MonitorScreenshotInclude<ExtArgs> | null
    /**
     * The filter to search for the MonitorScreenshot to update in case it exists.
     */
    where: MonitorScreenshotWhereUniqueInput
    /**
     * In case the MonitorScreenshot found by the `where` argument doesn't exist, create a new MonitorScreenshot with this data.
     */
    create: XOR<MonitorScreenshotCreateInput, MonitorScreenshotUncheckedCreateInput>
    /**
     * In case the MonitorScreenshot was found with the provided `where` argument, update it with this data.
     */
    update: XOR<MonitorScreenshotUpdateInput, MonitorScreenshotUncheckedUpdateInput>
  }

  /**
   * MonitorScreenshot delete
   */
  export type MonitorScreenshotDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorScreenshot
     */
    select?: MonitorScreenshotSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorScreenshot
     */
    omit?: MonitorScreenshotOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MonitorScreenshotInclude<ExtArgs> | null
    /**
     * Filter which MonitorScreenshot to delete.
     */
    where: MonitorScreenshotWhereUniqueInput
  }

  /**
   * MonitorScreenshot deleteMany
   */
  export type MonitorScreenshotDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which MonitorScreenshots to delete
     */
    where?: MonitorScreenshotWhereInput
    /**
     * Limit how many MonitorScreenshots to delete.
     */
    limit?: number
  }

  /**
   * MonitorScreenshot.batch
   */
  export type MonitorScreenshot$batchArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorScreenshotBatch
     */
    select?: MonitorScreenshotBatchSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorScreenshotBatch
     */
    omit?: MonitorScreenshotBatchOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MonitorScreenshotBatchInclude<ExtArgs> | null
    where?: MonitorScreenshotBatchWhereInput
  }

  /**
   * MonitorScreenshot without action
   */
  export type MonitorScreenshotDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MonitorScreenshot
     */
    select?: MonitorScreenshotSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MonitorScreenshot
     */
    omit?: MonitorScreenshotOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MonitorScreenshotInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const MonitorActivityEventScalarFieldEnum: {
    id: 'id',
    dailyKey: 'dailyKey',
    organizationId: 'organizationId',
    employeeId: 'employeeId',
    employeeName: 'employeeName',
    employeeCode: 'employeeCode',
    deviceId: 'deviceId',
    activityDate: 'activityDate',
    observedAt: 'observedAt',
    status: 'status',
    activeSeconds: 'activeSeconds',
    idleSeconds: 'idleSeconds',
    eventIds: 'eventIds',
    createdAt: 'createdAt'
  };

  export type MonitorActivityEventScalarFieldEnum = (typeof MonitorActivityEventScalarFieldEnum)[keyof typeof MonitorActivityEventScalarFieldEnum]


  export const MonitorDevicePresenceScalarFieldEnum: {
    deviceId: 'deviceId',
    organizationId: 'organizationId',
    employeeId: 'employeeId',
    employeeName: 'employeeName',
    status: 'status',
    lastSeenAt: 'lastSeenAt',
    updatedAt: 'updatedAt'
  };

  export type MonitorDevicePresenceScalarFieldEnum = (typeof MonitorDevicePresenceScalarFieldEnum)[keyof typeof MonitorDevicePresenceScalarFieldEnum]


  export const MonitorBrowserHistoryScalarFieldEnum: {
    entryId: 'entryId',
    organizationId: 'organizationId',
    employeeId: 'employeeId',
    employeeName: 'employeeName',
    deviceId: 'deviceId',
    observedAt: 'observedAt',
    browser: 'browser',
    url: 'url',
    title: 'title',
    activeWindowTitle: 'activeWindowTitle',
    durationMs: 'durationMs',
    createdAt: 'createdAt'
  };

  export type MonitorBrowserHistoryScalarFieldEnum = (typeof MonitorBrowserHistoryScalarFieldEnum)[keyof typeof MonitorBrowserHistoryScalarFieldEnum]


  export const MonitorAppUsageSessionScalarFieldEnum: {
    sessionId: 'sessionId',
    organizationId: 'organizationId',
    employeeId: 'employeeId',
    employeeName: 'employeeName',
    employeeCode: 'employeeCode',
    deviceId: 'deviceId',
    observedAt: 'observedAt',
    appName: 'appName',
    processName: 'processName',
    startedAt: 'startedAt',
    endedAt: 'endedAt',
    activeSeconds: 'activeSeconds',
    keyPressCount: 'keyPressCount',
    keyNames: 'keyNames',
    typedText: 'typedText',
    keyStreamText: 'keyStreamText',
    uploadStatus: 'uploadStatus',
    retryCount: 'retryCount',
    lastError: 'lastError',
    createdAt: 'createdAt',
    uploadedAt: 'uploadedAt'
  };

  export type MonitorAppUsageSessionScalarFieldEnum = (typeof MonitorAppUsageSessionScalarFieldEnum)[keyof typeof MonitorAppUsageSessionScalarFieldEnum]


  export const MonitorCloudinarySettingScalarFieldEnum: {
    organizationId: 'organizationId',
    cloudName: 'cloudName',
    apiKey: 'apiKey',
    apiSecretCiphertext: 'apiSecretCiphertext',
    apiSecretIv: 'apiSecretIv',
    apiSecretAuthTag: 'apiSecretAuthTag',
    uploadFolderRoot: 'uploadFolderRoot',
    screenshotsEnabled: 'screenshotsEnabled',
    mouseEnabled: 'mouseEnabled',
    keyboardEnabled: 'keyboardEnabled',
    appUsageEnabled: 'appUsageEnabled',
    browserHistoryEnabled: 'browserHistoryEnabled',
    usbEnabled: 'usbEnabled',
    screenshotIntervalMinutes: 'screenshotIntervalMinutes',
    mouseHeartbeatMinutes: 'mouseHeartbeatMinutes',
    mouseIdleThresholdMinutes: 'mouseIdleThresholdMinutes',
    keyboardHeartbeatMinutes: 'keyboardHeartbeatMinutes',
    appUsageHeartbeatMinutes: 'appUsageHeartbeatMinutes',
    browserHistorySyncMinutes: 'browserHistorySyncMinutes',
    updatedAt: 'updatedAt'
  };

  export type MonitorCloudinarySettingScalarFieldEnum = (typeof MonitorCloudinarySettingScalarFieldEnum)[keyof typeof MonitorCloudinarySettingScalarFieldEnum]


  export const MonitorDeviceHealthScalarFieldEnum: {
    id: 'id',
    organizationId: 'organizationId',
    employeeId: 'employeeId',
    employeeName: 'employeeName',
    employeeCode: 'employeeCode',
    deviceId: 'deviceId',
    hostname: 'hostname',
    platform: 'platform',
    platformVersion: 'platformVersion',
    agentVersion: 'agentVersion',
    cpuModel: 'cpuModel',
    cpuCoreCount: 'cpuCoreCount',
    cpuPercent: 'cpuPercent',
    memoryTotalBytes: 'memoryTotalBytes',
    memoryUsedBytes: 'memoryUsedBytes',
    memoryPercent: 'memoryPercent',
    disks: 'disks',
    temperatureC: 'temperatureC',
    batteryPercent: 'batteryPercent',
    batteryCharging: 'batteryCharging',
    uptimeSeconds: 'uptimeSeconds',
    lastSeenAt: 'lastSeenAt',
    reportedAt: 'reportedAt',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type MonitorDeviceHealthScalarFieldEnum = (typeof MonitorDeviceHealthScalarFieldEnum)[keyof typeof MonitorDeviceHealthScalarFieldEnum]


  export const MonitorScreenshotBatchScalarFieldEnum: {
    id: 'id',
    organizationId: 'organizationId',
    employeeId: 'employeeId',
    deviceId: 'deviceId',
    status: 'status',
    expectedCount: 'expectedCount',
    uploadedCount: 'uploadedCount',
    duplicateCount: 'duplicateCount',
    expectedBytes: 'expectedBytes',
    uploadedBytes: 'uploadedBytes',
    firstCapturedAt: 'firstCapturedAt',
    lastCapturedAt: 'lastCapturedAt',
    createdAt: 'createdAt',
    completedAt: 'completedAt'
  };

  export type MonitorScreenshotBatchScalarFieldEnum = (typeof MonitorScreenshotBatchScalarFieldEnum)[keyof typeof MonitorScreenshotBatchScalarFieldEnum]


  export const MonitorScreenshotScalarFieldEnum: {
    id: 'id',
    batchId: 'batchId',
    organizationId: 'organizationId',
    employeeId: 'employeeId',
    deviceId: 'deviceId',
    clientScreenshotId: 'clientScreenshotId',
    capturedAt: 'capturedAt',
    originalFileName: 'originalFileName',
    mimeType: 'mimeType',
    width: 'width',
    height: 'height',
    sha256: 'sha256',
    sizeBytes: 'sizeBytes',
    cloudinaryFolder: 'cloudinaryFolder',
    cloudinaryPublicId: 'cloudinaryPublicId',
    cloudinaryAssetId: 'cloudinaryAssetId',
    cloudinaryVersion: 'cloudinaryVersion',
    cloudinaryFormat: 'cloudinaryFormat',
    cloudinaryUrl: 'cloudinaryUrl',
    duplicateOf: 'duplicateOf',
    uploadStatus: 'uploadStatus',
    processingStatus: 'processingStatus',
    errorMessage: 'errorMessage',
    createdAt: 'createdAt',
    uploadedAt: 'uploadedAt'
  };

  export type MonitorScreenshotScalarFieldEnum = (typeof MonitorScreenshotScalarFieldEnum)[keyof typeof MonitorScreenshotScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const JsonNullValueInput: {
    JsonNull: typeof JsonNull
  };

  export type JsonNullValueInput = (typeof JsonNullValueInput)[keyof typeof JsonNullValueInput]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  export const JsonNullValueFilter: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull,
    AnyNull: typeof AnyNull
  };

  export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'Json'
   */
  export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>
    


  /**
   * Reference to a field of type 'QueryMode'
   */
  export type EnumQueryModeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QueryMode'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'BigInt'
   */
  export type BigIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'BigInt'>
    


  /**
   * Reference to a field of type 'BigInt[]'
   */
  export type ListBigIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'BigInt[]'>
    


  /**
   * Reference to a field of type 'Decimal'
   */
  export type DecimalFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Decimal'>
    


  /**
   * Reference to a field of type 'Decimal[]'
   */
  export type ListDecimalFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Decimal[]'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    
  /**
   * Deep Input Types
   */


  export type MonitorActivityEventWhereInput = {
    AND?: MonitorActivityEventWhereInput | MonitorActivityEventWhereInput[]
    OR?: MonitorActivityEventWhereInput[]
    NOT?: MonitorActivityEventWhereInput | MonitorActivityEventWhereInput[]
    id?: StringFilter<"MonitorActivityEvent"> | string
    dailyKey?: StringNullableFilter<"MonitorActivityEvent"> | string | null
    organizationId?: StringNullableFilter<"MonitorActivityEvent"> | string | null
    employeeId?: StringFilter<"MonitorActivityEvent"> | string
    employeeName?: StringNullableFilter<"MonitorActivityEvent"> | string | null
    employeeCode?: StringNullableFilter<"MonitorActivityEvent"> | string | null
    deviceId?: StringFilter<"MonitorActivityEvent"> | string
    activityDate?: DateTimeNullableFilter<"MonitorActivityEvent"> | Date | string | null
    observedAt?: DateTimeFilter<"MonitorActivityEvent"> | Date | string
    status?: StringFilter<"MonitorActivityEvent"> | string
    activeSeconds?: IntFilter<"MonitorActivityEvent"> | number
    idleSeconds?: IntFilter<"MonitorActivityEvent"> | number
    eventIds?: StringNullableListFilter<"MonitorActivityEvent">
    createdAt?: DateTimeFilter<"MonitorActivityEvent"> | Date | string
  }

  export type MonitorActivityEventOrderByWithRelationInput = {
    id?: SortOrder
    dailyKey?: SortOrderInput | SortOrder
    organizationId?: SortOrderInput | SortOrder
    employeeId?: SortOrder
    employeeName?: SortOrderInput | SortOrder
    employeeCode?: SortOrderInput | SortOrder
    deviceId?: SortOrder
    activityDate?: SortOrderInput | SortOrder
    observedAt?: SortOrder
    status?: SortOrder
    activeSeconds?: SortOrder
    idleSeconds?: SortOrder
    eventIds?: SortOrder
    createdAt?: SortOrder
  }

  export type MonitorActivityEventWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    dailyKey?: string
    deviceId_id?: MonitorActivityEventDeviceIdIdCompoundUniqueInput
    AND?: MonitorActivityEventWhereInput | MonitorActivityEventWhereInput[]
    OR?: MonitorActivityEventWhereInput[]
    NOT?: MonitorActivityEventWhereInput | MonitorActivityEventWhereInput[]
    organizationId?: StringNullableFilter<"MonitorActivityEvent"> | string | null
    employeeId?: StringFilter<"MonitorActivityEvent"> | string
    employeeName?: StringNullableFilter<"MonitorActivityEvent"> | string | null
    employeeCode?: StringNullableFilter<"MonitorActivityEvent"> | string | null
    deviceId?: StringFilter<"MonitorActivityEvent"> | string
    activityDate?: DateTimeNullableFilter<"MonitorActivityEvent"> | Date | string | null
    observedAt?: DateTimeFilter<"MonitorActivityEvent"> | Date | string
    status?: StringFilter<"MonitorActivityEvent"> | string
    activeSeconds?: IntFilter<"MonitorActivityEvent"> | number
    idleSeconds?: IntFilter<"MonitorActivityEvent"> | number
    eventIds?: StringNullableListFilter<"MonitorActivityEvent">
    createdAt?: DateTimeFilter<"MonitorActivityEvent"> | Date | string
  }, "id" | "dailyKey" | "deviceId_id">

  export type MonitorActivityEventOrderByWithAggregationInput = {
    id?: SortOrder
    dailyKey?: SortOrderInput | SortOrder
    organizationId?: SortOrderInput | SortOrder
    employeeId?: SortOrder
    employeeName?: SortOrderInput | SortOrder
    employeeCode?: SortOrderInput | SortOrder
    deviceId?: SortOrder
    activityDate?: SortOrderInput | SortOrder
    observedAt?: SortOrder
    status?: SortOrder
    activeSeconds?: SortOrder
    idleSeconds?: SortOrder
    eventIds?: SortOrder
    createdAt?: SortOrder
    _count?: MonitorActivityEventCountOrderByAggregateInput
    _avg?: MonitorActivityEventAvgOrderByAggregateInput
    _max?: MonitorActivityEventMaxOrderByAggregateInput
    _min?: MonitorActivityEventMinOrderByAggregateInput
    _sum?: MonitorActivityEventSumOrderByAggregateInput
  }

  export type MonitorActivityEventScalarWhereWithAggregatesInput = {
    AND?: MonitorActivityEventScalarWhereWithAggregatesInput | MonitorActivityEventScalarWhereWithAggregatesInput[]
    OR?: MonitorActivityEventScalarWhereWithAggregatesInput[]
    NOT?: MonitorActivityEventScalarWhereWithAggregatesInput | MonitorActivityEventScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"MonitorActivityEvent"> | string
    dailyKey?: StringNullableWithAggregatesFilter<"MonitorActivityEvent"> | string | null
    organizationId?: StringNullableWithAggregatesFilter<"MonitorActivityEvent"> | string | null
    employeeId?: StringWithAggregatesFilter<"MonitorActivityEvent"> | string
    employeeName?: StringNullableWithAggregatesFilter<"MonitorActivityEvent"> | string | null
    employeeCode?: StringNullableWithAggregatesFilter<"MonitorActivityEvent"> | string | null
    deviceId?: StringWithAggregatesFilter<"MonitorActivityEvent"> | string
    activityDate?: DateTimeNullableWithAggregatesFilter<"MonitorActivityEvent"> | Date | string | null
    observedAt?: DateTimeWithAggregatesFilter<"MonitorActivityEvent"> | Date | string
    status?: StringWithAggregatesFilter<"MonitorActivityEvent"> | string
    activeSeconds?: IntWithAggregatesFilter<"MonitorActivityEvent"> | number
    idleSeconds?: IntWithAggregatesFilter<"MonitorActivityEvent"> | number
    eventIds?: StringNullableListFilter<"MonitorActivityEvent">
    createdAt?: DateTimeWithAggregatesFilter<"MonitorActivityEvent"> | Date | string
  }

  export type MonitorDevicePresenceWhereInput = {
    AND?: MonitorDevicePresenceWhereInput | MonitorDevicePresenceWhereInput[]
    OR?: MonitorDevicePresenceWhereInput[]
    NOT?: MonitorDevicePresenceWhereInput | MonitorDevicePresenceWhereInput[]
    deviceId?: StringFilter<"MonitorDevicePresence"> | string
    organizationId?: StringNullableFilter<"MonitorDevicePresence"> | string | null
    employeeId?: StringFilter<"MonitorDevicePresence"> | string
    employeeName?: StringNullableFilter<"MonitorDevicePresence"> | string | null
    status?: StringFilter<"MonitorDevicePresence"> | string
    lastSeenAt?: DateTimeFilter<"MonitorDevicePresence"> | Date | string
    updatedAt?: DateTimeFilter<"MonitorDevicePresence"> | Date | string
  }

  export type MonitorDevicePresenceOrderByWithRelationInput = {
    deviceId?: SortOrder
    organizationId?: SortOrderInput | SortOrder
    employeeId?: SortOrder
    employeeName?: SortOrderInput | SortOrder
    status?: SortOrder
    lastSeenAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type MonitorDevicePresenceWhereUniqueInput = Prisma.AtLeast<{
    deviceId?: string
    AND?: MonitorDevicePresenceWhereInput | MonitorDevicePresenceWhereInput[]
    OR?: MonitorDevicePresenceWhereInput[]
    NOT?: MonitorDevicePresenceWhereInput | MonitorDevicePresenceWhereInput[]
    organizationId?: StringNullableFilter<"MonitorDevicePresence"> | string | null
    employeeId?: StringFilter<"MonitorDevicePresence"> | string
    employeeName?: StringNullableFilter<"MonitorDevicePresence"> | string | null
    status?: StringFilter<"MonitorDevicePresence"> | string
    lastSeenAt?: DateTimeFilter<"MonitorDevicePresence"> | Date | string
    updatedAt?: DateTimeFilter<"MonitorDevicePresence"> | Date | string
  }, "deviceId">

  export type MonitorDevicePresenceOrderByWithAggregationInput = {
    deviceId?: SortOrder
    organizationId?: SortOrderInput | SortOrder
    employeeId?: SortOrder
    employeeName?: SortOrderInput | SortOrder
    status?: SortOrder
    lastSeenAt?: SortOrder
    updatedAt?: SortOrder
    _count?: MonitorDevicePresenceCountOrderByAggregateInput
    _max?: MonitorDevicePresenceMaxOrderByAggregateInput
    _min?: MonitorDevicePresenceMinOrderByAggregateInput
  }

  export type MonitorDevicePresenceScalarWhereWithAggregatesInput = {
    AND?: MonitorDevicePresenceScalarWhereWithAggregatesInput | MonitorDevicePresenceScalarWhereWithAggregatesInput[]
    OR?: MonitorDevicePresenceScalarWhereWithAggregatesInput[]
    NOT?: MonitorDevicePresenceScalarWhereWithAggregatesInput | MonitorDevicePresenceScalarWhereWithAggregatesInput[]
    deviceId?: StringWithAggregatesFilter<"MonitorDevicePresence"> | string
    organizationId?: StringNullableWithAggregatesFilter<"MonitorDevicePresence"> | string | null
    employeeId?: StringWithAggregatesFilter<"MonitorDevicePresence"> | string
    employeeName?: StringNullableWithAggregatesFilter<"MonitorDevicePresence"> | string | null
    status?: StringWithAggregatesFilter<"MonitorDevicePresence"> | string
    lastSeenAt?: DateTimeWithAggregatesFilter<"MonitorDevicePresence"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"MonitorDevicePresence"> | Date | string
  }

  export type MonitorBrowserHistoryWhereInput = {
    AND?: MonitorBrowserHistoryWhereInput | MonitorBrowserHistoryWhereInput[]
    OR?: MonitorBrowserHistoryWhereInput[]
    NOT?: MonitorBrowserHistoryWhereInput | MonitorBrowserHistoryWhereInput[]
    entryId?: StringFilter<"MonitorBrowserHistory"> | string
    organizationId?: StringNullableFilter<"MonitorBrowserHistory"> | string | null
    employeeId?: StringFilter<"MonitorBrowserHistory"> | string
    employeeName?: StringNullableFilter<"MonitorBrowserHistory"> | string | null
    deviceId?: StringFilter<"MonitorBrowserHistory"> | string
    observedAt?: DateTimeFilter<"MonitorBrowserHistory"> | Date | string
    browser?: StringFilter<"MonitorBrowserHistory"> | string
    url?: StringFilter<"MonitorBrowserHistory"> | string
    title?: StringFilter<"MonitorBrowserHistory"> | string
    activeWindowTitle?: StringNullableFilter<"MonitorBrowserHistory"> | string | null
    durationMs?: IntFilter<"MonitorBrowserHistory"> | number
    createdAt?: DateTimeFilter<"MonitorBrowserHistory"> | Date | string
  }

  export type MonitorBrowserHistoryOrderByWithRelationInput = {
    entryId?: SortOrder
    organizationId?: SortOrderInput | SortOrder
    employeeId?: SortOrder
    employeeName?: SortOrderInput | SortOrder
    deviceId?: SortOrder
    observedAt?: SortOrder
    browser?: SortOrder
    url?: SortOrder
    title?: SortOrder
    activeWindowTitle?: SortOrderInput | SortOrder
    durationMs?: SortOrder
    createdAt?: SortOrder
  }

  export type MonitorBrowserHistoryWhereUniqueInput = Prisma.AtLeast<{
    entryId?: string
    deviceId_entryId?: MonitorBrowserHistoryDeviceIdEntryIdCompoundUniqueInput
    AND?: MonitorBrowserHistoryWhereInput | MonitorBrowserHistoryWhereInput[]
    OR?: MonitorBrowserHistoryWhereInput[]
    NOT?: MonitorBrowserHistoryWhereInput | MonitorBrowserHistoryWhereInput[]
    organizationId?: StringNullableFilter<"MonitorBrowserHistory"> | string | null
    employeeId?: StringFilter<"MonitorBrowserHistory"> | string
    employeeName?: StringNullableFilter<"MonitorBrowserHistory"> | string | null
    deviceId?: StringFilter<"MonitorBrowserHistory"> | string
    observedAt?: DateTimeFilter<"MonitorBrowserHistory"> | Date | string
    browser?: StringFilter<"MonitorBrowserHistory"> | string
    url?: StringFilter<"MonitorBrowserHistory"> | string
    title?: StringFilter<"MonitorBrowserHistory"> | string
    activeWindowTitle?: StringNullableFilter<"MonitorBrowserHistory"> | string | null
    durationMs?: IntFilter<"MonitorBrowserHistory"> | number
    createdAt?: DateTimeFilter<"MonitorBrowserHistory"> | Date | string
  }, "entryId" | "deviceId_entryId">

  export type MonitorBrowserHistoryOrderByWithAggregationInput = {
    entryId?: SortOrder
    organizationId?: SortOrderInput | SortOrder
    employeeId?: SortOrder
    employeeName?: SortOrderInput | SortOrder
    deviceId?: SortOrder
    observedAt?: SortOrder
    browser?: SortOrder
    url?: SortOrder
    title?: SortOrder
    activeWindowTitle?: SortOrderInput | SortOrder
    durationMs?: SortOrder
    createdAt?: SortOrder
    _count?: MonitorBrowserHistoryCountOrderByAggregateInput
    _avg?: MonitorBrowserHistoryAvgOrderByAggregateInput
    _max?: MonitorBrowserHistoryMaxOrderByAggregateInput
    _min?: MonitorBrowserHistoryMinOrderByAggregateInput
    _sum?: MonitorBrowserHistorySumOrderByAggregateInput
  }

  export type MonitorBrowserHistoryScalarWhereWithAggregatesInput = {
    AND?: MonitorBrowserHistoryScalarWhereWithAggregatesInput | MonitorBrowserHistoryScalarWhereWithAggregatesInput[]
    OR?: MonitorBrowserHistoryScalarWhereWithAggregatesInput[]
    NOT?: MonitorBrowserHistoryScalarWhereWithAggregatesInput | MonitorBrowserHistoryScalarWhereWithAggregatesInput[]
    entryId?: StringWithAggregatesFilter<"MonitorBrowserHistory"> | string
    organizationId?: StringNullableWithAggregatesFilter<"MonitorBrowserHistory"> | string | null
    employeeId?: StringWithAggregatesFilter<"MonitorBrowserHistory"> | string
    employeeName?: StringNullableWithAggregatesFilter<"MonitorBrowserHistory"> | string | null
    deviceId?: StringWithAggregatesFilter<"MonitorBrowserHistory"> | string
    observedAt?: DateTimeWithAggregatesFilter<"MonitorBrowserHistory"> | Date | string
    browser?: StringWithAggregatesFilter<"MonitorBrowserHistory"> | string
    url?: StringWithAggregatesFilter<"MonitorBrowserHistory"> | string
    title?: StringWithAggregatesFilter<"MonitorBrowserHistory"> | string
    activeWindowTitle?: StringNullableWithAggregatesFilter<"MonitorBrowserHistory"> | string | null
    durationMs?: IntWithAggregatesFilter<"MonitorBrowserHistory"> | number
    createdAt?: DateTimeWithAggregatesFilter<"MonitorBrowserHistory"> | Date | string
  }

  export type MonitorAppUsageSessionWhereInput = {
    AND?: MonitorAppUsageSessionWhereInput | MonitorAppUsageSessionWhereInput[]
    OR?: MonitorAppUsageSessionWhereInput[]
    NOT?: MonitorAppUsageSessionWhereInput | MonitorAppUsageSessionWhereInput[]
    sessionId?: StringFilter<"MonitorAppUsageSession"> | string
    organizationId?: StringNullableFilter<"MonitorAppUsageSession"> | string | null
    employeeId?: StringFilter<"MonitorAppUsageSession"> | string
    employeeName?: StringNullableFilter<"MonitorAppUsageSession"> | string | null
    employeeCode?: StringNullableFilter<"MonitorAppUsageSession"> | string | null
    deviceId?: StringFilter<"MonitorAppUsageSession"> | string
    observedAt?: DateTimeFilter<"MonitorAppUsageSession"> | Date | string
    appName?: StringFilter<"MonitorAppUsageSession"> | string
    processName?: StringFilter<"MonitorAppUsageSession"> | string
    startedAt?: DateTimeFilter<"MonitorAppUsageSession"> | Date | string
    endedAt?: DateTimeFilter<"MonitorAppUsageSession"> | Date | string
    activeSeconds?: IntFilter<"MonitorAppUsageSession"> | number
    keyPressCount?: IntFilter<"MonitorAppUsageSession"> | number
    keyNames?: JsonFilter<"MonitorAppUsageSession">
    typedText?: StringFilter<"MonitorAppUsageSession"> | string
    keyStreamText?: StringFilter<"MonitorAppUsageSession"> | string
    uploadStatus?: StringFilter<"MonitorAppUsageSession"> | string
    retryCount?: IntFilter<"MonitorAppUsageSession"> | number
    lastError?: StringNullableFilter<"MonitorAppUsageSession"> | string | null
    createdAt?: DateTimeFilter<"MonitorAppUsageSession"> | Date | string
    uploadedAt?: DateTimeNullableFilter<"MonitorAppUsageSession"> | Date | string | null
  }

  export type MonitorAppUsageSessionOrderByWithRelationInput = {
    sessionId?: SortOrder
    organizationId?: SortOrderInput | SortOrder
    employeeId?: SortOrder
    employeeName?: SortOrderInput | SortOrder
    employeeCode?: SortOrderInput | SortOrder
    deviceId?: SortOrder
    observedAt?: SortOrder
    appName?: SortOrder
    processName?: SortOrder
    startedAt?: SortOrder
    endedAt?: SortOrder
    activeSeconds?: SortOrder
    keyPressCount?: SortOrder
    keyNames?: SortOrder
    typedText?: SortOrder
    keyStreamText?: SortOrder
    uploadStatus?: SortOrder
    retryCount?: SortOrder
    lastError?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    uploadedAt?: SortOrderInput | SortOrder
  }

  export type MonitorAppUsageSessionWhereUniqueInput = Prisma.AtLeast<{
    sessionId?: string
    deviceId_sessionId?: MonitorAppUsageSessionDeviceIdSessionIdCompoundUniqueInput
    AND?: MonitorAppUsageSessionWhereInput | MonitorAppUsageSessionWhereInput[]
    OR?: MonitorAppUsageSessionWhereInput[]
    NOT?: MonitorAppUsageSessionWhereInput | MonitorAppUsageSessionWhereInput[]
    organizationId?: StringNullableFilter<"MonitorAppUsageSession"> | string | null
    employeeId?: StringFilter<"MonitorAppUsageSession"> | string
    employeeName?: StringNullableFilter<"MonitorAppUsageSession"> | string | null
    employeeCode?: StringNullableFilter<"MonitorAppUsageSession"> | string | null
    deviceId?: StringFilter<"MonitorAppUsageSession"> | string
    observedAt?: DateTimeFilter<"MonitorAppUsageSession"> | Date | string
    appName?: StringFilter<"MonitorAppUsageSession"> | string
    processName?: StringFilter<"MonitorAppUsageSession"> | string
    startedAt?: DateTimeFilter<"MonitorAppUsageSession"> | Date | string
    endedAt?: DateTimeFilter<"MonitorAppUsageSession"> | Date | string
    activeSeconds?: IntFilter<"MonitorAppUsageSession"> | number
    keyPressCount?: IntFilter<"MonitorAppUsageSession"> | number
    keyNames?: JsonFilter<"MonitorAppUsageSession">
    typedText?: StringFilter<"MonitorAppUsageSession"> | string
    keyStreamText?: StringFilter<"MonitorAppUsageSession"> | string
    uploadStatus?: StringFilter<"MonitorAppUsageSession"> | string
    retryCount?: IntFilter<"MonitorAppUsageSession"> | number
    lastError?: StringNullableFilter<"MonitorAppUsageSession"> | string | null
    createdAt?: DateTimeFilter<"MonitorAppUsageSession"> | Date | string
    uploadedAt?: DateTimeNullableFilter<"MonitorAppUsageSession"> | Date | string | null
  }, "sessionId" | "deviceId_sessionId">

  export type MonitorAppUsageSessionOrderByWithAggregationInput = {
    sessionId?: SortOrder
    organizationId?: SortOrderInput | SortOrder
    employeeId?: SortOrder
    employeeName?: SortOrderInput | SortOrder
    employeeCode?: SortOrderInput | SortOrder
    deviceId?: SortOrder
    observedAt?: SortOrder
    appName?: SortOrder
    processName?: SortOrder
    startedAt?: SortOrder
    endedAt?: SortOrder
    activeSeconds?: SortOrder
    keyPressCount?: SortOrder
    keyNames?: SortOrder
    typedText?: SortOrder
    keyStreamText?: SortOrder
    uploadStatus?: SortOrder
    retryCount?: SortOrder
    lastError?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    uploadedAt?: SortOrderInput | SortOrder
    _count?: MonitorAppUsageSessionCountOrderByAggregateInput
    _avg?: MonitorAppUsageSessionAvgOrderByAggregateInput
    _max?: MonitorAppUsageSessionMaxOrderByAggregateInput
    _min?: MonitorAppUsageSessionMinOrderByAggregateInput
    _sum?: MonitorAppUsageSessionSumOrderByAggregateInput
  }

  export type MonitorAppUsageSessionScalarWhereWithAggregatesInput = {
    AND?: MonitorAppUsageSessionScalarWhereWithAggregatesInput | MonitorAppUsageSessionScalarWhereWithAggregatesInput[]
    OR?: MonitorAppUsageSessionScalarWhereWithAggregatesInput[]
    NOT?: MonitorAppUsageSessionScalarWhereWithAggregatesInput | MonitorAppUsageSessionScalarWhereWithAggregatesInput[]
    sessionId?: StringWithAggregatesFilter<"MonitorAppUsageSession"> | string
    organizationId?: StringNullableWithAggregatesFilter<"MonitorAppUsageSession"> | string | null
    employeeId?: StringWithAggregatesFilter<"MonitorAppUsageSession"> | string
    employeeName?: StringNullableWithAggregatesFilter<"MonitorAppUsageSession"> | string | null
    employeeCode?: StringNullableWithAggregatesFilter<"MonitorAppUsageSession"> | string | null
    deviceId?: StringWithAggregatesFilter<"MonitorAppUsageSession"> | string
    observedAt?: DateTimeWithAggregatesFilter<"MonitorAppUsageSession"> | Date | string
    appName?: StringWithAggregatesFilter<"MonitorAppUsageSession"> | string
    processName?: StringWithAggregatesFilter<"MonitorAppUsageSession"> | string
    startedAt?: DateTimeWithAggregatesFilter<"MonitorAppUsageSession"> | Date | string
    endedAt?: DateTimeWithAggregatesFilter<"MonitorAppUsageSession"> | Date | string
    activeSeconds?: IntWithAggregatesFilter<"MonitorAppUsageSession"> | number
    keyPressCount?: IntWithAggregatesFilter<"MonitorAppUsageSession"> | number
    keyNames?: JsonWithAggregatesFilter<"MonitorAppUsageSession">
    typedText?: StringWithAggregatesFilter<"MonitorAppUsageSession"> | string
    keyStreamText?: StringWithAggregatesFilter<"MonitorAppUsageSession"> | string
    uploadStatus?: StringWithAggregatesFilter<"MonitorAppUsageSession"> | string
    retryCount?: IntWithAggregatesFilter<"MonitorAppUsageSession"> | number
    lastError?: StringNullableWithAggregatesFilter<"MonitorAppUsageSession"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"MonitorAppUsageSession"> | Date | string
    uploadedAt?: DateTimeNullableWithAggregatesFilter<"MonitorAppUsageSession"> | Date | string | null
  }

  export type MonitorCloudinarySettingWhereInput = {
    AND?: MonitorCloudinarySettingWhereInput | MonitorCloudinarySettingWhereInput[]
    OR?: MonitorCloudinarySettingWhereInput[]
    NOT?: MonitorCloudinarySettingWhereInput | MonitorCloudinarySettingWhereInput[]
    organizationId?: StringFilter<"MonitorCloudinarySetting"> | string
    cloudName?: StringFilter<"MonitorCloudinarySetting"> | string
    apiKey?: StringFilter<"MonitorCloudinarySetting"> | string
    apiSecretCiphertext?: StringFilter<"MonitorCloudinarySetting"> | string
    apiSecretIv?: StringFilter<"MonitorCloudinarySetting"> | string
    apiSecretAuthTag?: StringFilter<"MonitorCloudinarySetting"> | string
    uploadFolderRoot?: StringFilter<"MonitorCloudinarySetting"> | string
    screenshotsEnabled?: BoolFilter<"MonitorCloudinarySetting"> | boolean
    mouseEnabled?: BoolFilter<"MonitorCloudinarySetting"> | boolean
    keyboardEnabled?: BoolFilter<"MonitorCloudinarySetting"> | boolean
    appUsageEnabled?: BoolFilter<"MonitorCloudinarySetting"> | boolean
    browserHistoryEnabled?: BoolFilter<"MonitorCloudinarySetting"> | boolean
    usbEnabled?: BoolFilter<"MonitorCloudinarySetting"> | boolean
    screenshotIntervalMinutes?: IntFilter<"MonitorCloudinarySetting"> | number
    mouseHeartbeatMinutes?: IntFilter<"MonitorCloudinarySetting"> | number
    mouseIdleThresholdMinutes?: IntFilter<"MonitorCloudinarySetting"> | number
    keyboardHeartbeatMinutes?: IntFilter<"MonitorCloudinarySetting"> | number
    appUsageHeartbeatMinutes?: IntFilter<"MonitorCloudinarySetting"> | number
    browserHistorySyncMinutes?: IntFilter<"MonitorCloudinarySetting"> | number
    updatedAt?: DateTimeFilter<"MonitorCloudinarySetting"> | Date | string
  }

  export type MonitorCloudinarySettingOrderByWithRelationInput = {
    organizationId?: SortOrder
    cloudName?: SortOrder
    apiKey?: SortOrder
    apiSecretCiphertext?: SortOrder
    apiSecretIv?: SortOrder
    apiSecretAuthTag?: SortOrder
    uploadFolderRoot?: SortOrder
    screenshotsEnabled?: SortOrder
    mouseEnabled?: SortOrder
    keyboardEnabled?: SortOrder
    appUsageEnabled?: SortOrder
    browserHistoryEnabled?: SortOrder
    usbEnabled?: SortOrder
    screenshotIntervalMinutes?: SortOrder
    mouseHeartbeatMinutes?: SortOrder
    mouseIdleThresholdMinutes?: SortOrder
    keyboardHeartbeatMinutes?: SortOrder
    appUsageHeartbeatMinutes?: SortOrder
    browserHistorySyncMinutes?: SortOrder
    updatedAt?: SortOrder
  }

  export type MonitorCloudinarySettingWhereUniqueInput = Prisma.AtLeast<{
    organizationId?: string
    AND?: MonitorCloudinarySettingWhereInput | MonitorCloudinarySettingWhereInput[]
    OR?: MonitorCloudinarySettingWhereInput[]
    NOT?: MonitorCloudinarySettingWhereInput | MonitorCloudinarySettingWhereInput[]
    cloudName?: StringFilter<"MonitorCloudinarySetting"> | string
    apiKey?: StringFilter<"MonitorCloudinarySetting"> | string
    apiSecretCiphertext?: StringFilter<"MonitorCloudinarySetting"> | string
    apiSecretIv?: StringFilter<"MonitorCloudinarySetting"> | string
    apiSecretAuthTag?: StringFilter<"MonitorCloudinarySetting"> | string
    uploadFolderRoot?: StringFilter<"MonitorCloudinarySetting"> | string
    screenshotsEnabled?: BoolFilter<"MonitorCloudinarySetting"> | boolean
    mouseEnabled?: BoolFilter<"MonitorCloudinarySetting"> | boolean
    keyboardEnabled?: BoolFilter<"MonitorCloudinarySetting"> | boolean
    appUsageEnabled?: BoolFilter<"MonitorCloudinarySetting"> | boolean
    browserHistoryEnabled?: BoolFilter<"MonitorCloudinarySetting"> | boolean
    usbEnabled?: BoolFilter<"MonitorCloudinarySetting"> | boolean
    screenshotIntervalMinutes?: IntFilter<"MonitorCloudinarySetting"> | number
    mouseHeartbeatMinutes?: IntFilter<"MonitorCloudinarySetting"> | number
    mouseIdleThresholdMinutes?: IntFilter<"MonitorCloudinarySetting"> | number
    keyboardHeartbeatMinutes?: IntFilter<"MonitorCloudinarySetting"> | number
    appUsageHeartbeatMinutes?: IntFilter<"MonitorCloudinarySetting"> | number
    browserHistorySyncMinutes?: IntFilter<"MonitorCloudinarySetting"> | number
    updatedAt?: DateTimeFilter<"MonitorCloudinarySetting"> | Date | string
  }, "organizationId">

  export type MonitorCloudinarySettingOrderByWithAggregationInput = {
    organizationId?: SortOrder
    cloudName?: SortOrder
    apiKey?: SortOrder
    apiSecretCiphertext?: SortOrder
    apiSecretIv?: SortOrder
    apiSecretAuthTag?: SortOrder
    uploadFolderRoot?: SortOrder
    screenshotsEnabled?: SortOrder
    mouseEnabled?: SortOrder
    keyboardEnabled?: SortOrder
    appUsageEnabled?: SortOrder
    browserHistoryEnabled?: SortOrder
    usbEnabled?: SortOrder
    screenshotIntervalMinutes?: SortOrder
    mouseHeartbeatMinutes?: SortOrder
    mouseIdleThresholdMinutes?: SortOrder
    keyboardHeartbeatMinutes?: SortOrder
    appUsageHeartbeatMinutes?: SortOrder
    browserHistorySyncMinutes?: SortOrder
    updatedAt?: SortOrder
    _count?: MonitorCloudinarySettingCountOrderByAggregateInput
    _avg?: MonitorCloudinarySettingAvgOrderByAggregateInput
    _max?: MonitorCloudinarySettingMaxOrderByAggregateInput
    _min?: MonitorCloudinarySettingMinOrderByAggregateInput
    _sum?: MonitorCloudinarySettingSumOrderByAggregateInput
  }

  export type MonitorCloudinarySettingScalarWhereWithAggregatesInput = {
    AND?: MonitorCloudinarySettingScalarWhereWithAggregatesInput | MonitorCloudinarySettingScalarWhereWithAggregatesInput[]
    OR?: MonitorCloudinarySettingScalarWhereWithAggregatesInput[]
    NOT?: MonitorCloudinarySettingScalarWhereWithAggregatesInput | MonitorCloudinarySettingScalarWhereWithAggregatesInput[]
    organizationId?: StringWithAggregatesFilter<"MonitorCloudinarySetting"> | string
    cloudName?: StringWithAggregatesFilter<"MonitorCloudinarySetting"> | string
    apiKey?: StringWithAggregatesFilter<"MonitorCloudinarySetting"> | string
    apiSecretCiphertext?: StringWithAggregatesFilter<"MonitorCloudinarySetting"> | string
    apiSecretIv?: StringWithAggregatesFilter<"MonitorCloudinarySetting"> | string
    apiSecretAuthTag?: StringWithAggregatesFilter<"MonitorCloudinarySetting"> | string
    uploadFolderRoot?: StringWithAggregatesFilter<"MonitorCloudinarySetting"> | string
    screenshotsEnabled?: BoolWithAggregatesFilter<"MonitorCloudinarySetting"> | boolean
    mouseEnabled?: BoolWithAggregatesFilter<"MonitorCloudinarySetting"> | boolean
    keyboardEnabled?: BoolWithAggregatesFilter<"MonitorCloudinarySetting"> | boolean
    appUsageEnabled?: BoolWithAggregatesFilter<"MonitorCloudinarySetting"> | boolean
    browserHistoryEnabled?: BoolWithAggregatesFilter<"MonitorCloudinarySetting"> | boolean
    usbEnabled?: BoolWithAggregatesFilter<"MonitorCloudinarySetting"> | boolean
    screenshotIntervalMinutes?: IntWithAggregatesFilter<"MonitorCloudinarySetting"> | number
    mouseHeartbeatMinutes?: IntWithAggregatesFilter<"MonitorCloudinarySetting"> | number
    mouseIdleThresholdMinutes?: IntWithAggregatesFilter<"MonitorCloudinarySetting"> | number
    keyboardHeartbeatMinutes?: IntWithAggregatesFilter<"MonitorCloudinarySetting"> | number
    appUsageHeartbeatMinutes?: IntWithAggregatesFilter<"MonitorCloudinarySetting"> | number
    browserHistorySyncMinutes?: IntWithAggregatesFilter<"MonitorCloudinarySetting"> | number
    updatedAt?: DateTimeWithAggregatesFilter<"MonitorCloudinarySetting"> | Date | string
  }

  export type MonitorDeviceHealthWhereInput = {
    AND?: MonitorDeviceHealthWhereInput | MonitorDeviceHealthWhereInput[]
    OR?: MonitorDeviceHealthWhereInput[]
    NOT?: MonitorDeviceHealthWhereInput | MonitorDeviceHealthWhereInput[]
    id?: BigIntFilter<"MonitorDeviceHealth"> | bigint | number
    organizationId?: StringNullableFilter<"MonitorDeviceHealth"> | string | null
    employeeId?: StringFilter<"MonitorDeviceHealth"> | string
    employeeName?: StringNullableFilter<"MonitorDeviceHealth"> | string | null
    employeeCode?: StringNullableFilter<"MonitorDeviceHealth"> | string | null
    deviceId?: StringFilter<"MonitorDeviceHealth"> | string
    hostname?: StringNullableFilter<"MonitorDeviceHealth"> | string | null
    platform?: StringNullableFilter<"MonitorDeviceHealth"> | string | null
    platformVersion?: StringNullableFilter<"MonitorDeviceHealth"> | string | null
    agentVersion?: StringNullableFilter<"MonitorDeviceHealth"> | string | null
    cpuModel?: StringNullableFilter<"MonitorDeviceHealth"> | string | null
    cpuCoreCount?: IntNullableFilter<"MonitorDeviceHealth"> | number | null
    cpuPercent?: DecimalNullableFilter<"MonitorDeviceHealth"> | Decimal | DecimalJsLike | number | string | null
    memoryTotalBytes?: BigIntNullableFilter<"MonitorDeviceHealth"> | bigint | number | null
    memoryUsedBytes?: BigIntNullableFilter<"MonitorDeviceHealth"> | bigint | number | null
    memoryPercent?: DecimalNullableFilter<"MonitorDeviceHealth"> | Decimal | DecimalJsLike | number | string | null
    disks?: JsonFilter<"MonitorDeviceHealth">
    temperatureC?: DecimalNullableFilter<"MonitorDeviceHealth"> | Decimal | DecimalJsLike | number | string | null
    batteryPercent?: DecimalNullableFilter<"MonitorDeviceHealth"> | Decimal | DecimalJsLike | number | string | null
    batteryCharging?: BoolNullableFilter<"MonitorDeviceHealth"> | boolean | null
    uptimeSeconds?: BigIntNullableFilter<"MonitorDeviceHealth"> | bigint | number | null
    lastSeenAt?: DateTimeFilter<"MonitorDeviceHealth"> | Date | string
    reportedAt?: DateTimeFilter<"MonitorDeviceHealth"> | Date | string
    createdAt?: DateTimeFilter<"MonitorDeviceHealth"> | Date | string
    updatedAt?: DateTimeFilter<"MonitorDeviceHealth"> | Date | string
  }

  export type MonitorDeviceHealthOrderByWithRelationInput = {
    id?: SortOrder
    organizationId?: SortOrderInput | SortOrder
    employeeId?: SortOrder
    employeeName?: SortOrderInput | SortOrder
    employeeCode?: SortOrderInput | SortOrder
    deviceId?: SortOrder
    hostname?: SortOrderInput | SortOrder
    platform?: SortOrderInput | SortOrder
    platformVersion?: SortOrderInput | SortOrder
    agentVersion?: SortOrderInput | SortOrder
    cpuModel?: SortOrderInput | SortOrder
    cpuCoreCount?: SortOrderInput | SortOrder
    cpuPercent?: SortOrderInput | SortOrder
    memoryTotalBytes?: SortOrderInput | SortOrder
    memoryUsedBytes?: SortOrderInput | SortOrder
    memoryPercent?: SortOrderInput | SortOrder
    disks?: SortOrder
    temperatureC?: SortOrderInput | SortOrder
    batteryPercent?: SortOrderInput | SortOrder
    batteryCharging?: SortOrderInput | SortOrder
    uptimeSeconds?: SortOrderInput | SortOrder
    lastSeenAt?: SortOrder
    reportedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type MonitorDeviceHealthWhereUniqueInput = Prisma.AtLeast<{
    id?: bigint | number
    organizationId_deviceId?: MonitorDeviceHealthOrganizationIdDeviceIdCompoundUniqueInput
    AND?: MonitorDeviceHealthWhereInput | MonitorDeviceHealthWhereInput[]
    OR?: MonitorDeviceHealthWhereInput[]
    NOT?: MonitorDeviceHealthWhereInput | MonitorDeviceHealthWhereInput[]
    organizationId?: StringNullableFilter<"MonitorDeviceHealth"> | string | null
    employeeId?: StringFilter<"MonitorDeviceHealth"> | string
    employeeName?: StringNullableFilter<"MonitorDeviceHealth"> | string | null
    employeeCode?: StringNullableFilter<"MonitorDeviceHealth"> | string | null
    deviceId?: StringFilter<"MonitorDeviceHealth"> | string
    hostname?: StringNullableFilter<"MonitorDeviceHealth"> | string | null
    platform?: StringNullableFilter<"MonitorDeviceHealth"> | string | null
    platformVersion?: StringNullableFilter<"MonitorDeviceHealth"> | string | null
    agentVersion?: StringNullableFilter<"MonitorDeviceHealth"> | string | null
    cpuModel?: StringNullableFilter<"MonitorDeviceHealth"> | string | null
    cpuCoreCount?: IntNullableFilter<"MonitorDeviceHealth"> | number | null
    cpuPercent?: DecimalNullableFilter<"MonitorDeviceHealth"> | Decimal | DecimalJsLike | number | string | null
    memoryTotalBytes?: BigIntNullableFilter<"MonitorDeviceHealth"> | bigint | number | null
    memoryUsedBytes?: BigIntNullableFilter<"MonitorDeviceHealth"> | bigint | number | null
    memoryPercent?: DecimalNullableFilter<"MonitorDeviceHealth"> | Decimal | DecimalJsLike | number | string | null
    disks?: JsonFilter<"MonitorDeviceHealth">
    temperatureC?: DecimalNullableFilter<"MonitorDeviceHealth"> | Decimal | DecimalJsLike | number | string | null
    batteryPercent?: DecimalNullableFilter<"MonitorDeviceHealth"> | Decimal | DecimalJsLike | number | string | null
    batteryCharging?: BoolNullableFilter<"MonitorDeviceHealth"> | boolean | null
    uptimeSeconds?: BigIntNullableFilter<"MonitorDeviceHealth"> | bigint | number | null
    lastSeenAt?: DateTimeFilter<"MonitorDeviceHealth"> | Date | string
    reportedAt?: DateTimeFilter<"MonitorDeviceHealth"> | Date | string
    createdAt?: DateTimeFilter<"MonitorDeviceHealth"> | Date | string
    updatedAt?: DateTimeFilter<"MonitorDeviceHealth"> | Date | string
  }, "id" | "organizationId_deviceId">

  export type MonitorDeviceHealthOrderByWithAggregationInput = {
    id?: SortOrder
    organizationId?: SortOrderInput | SortOrder
    employeeId?: SortOrder
    employeeName?: SortOrderInput | SortOrder
    employeeCode?: SortOrderInput | SortOrder
    deviceId?: SortOrder
    hostname?: SortOrderInput | SortOrder
    platform?: SortOrderInput | SortOrder
    platformVersion?: SortOrderInput | SortOrder
    agentVersion?: SortOrderInput | SortOrder
    cpuModel?: SortOrderInput | SortOrder
    cpuCoreCount?: SortOrderInput | SortOrder
    cpuPercent?: SortOrderInput | SortOrder
    memoryTotalBytes?: SortOrderInput | SortOrder
    memoryUsedBytes?: SortOrderInput | SortOrder
    memoryPercent?: SortOrderInput | SortOrder
    disks?: SortOrder
    temperatureC?: SortOrderInput | SortOrder
    batteryPercent?: SortOrderInput | SortOrder
    batteryCharging?: SortOrderInput | SortOrder
    uptimeSeconds?: SortOrderInput | SortOrder
    lastSeenAt?: SortOrder
    reportedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: MonitorDeviceHealthCountOrderByAggregateInput
    _avg?: MonitorDeviceHealthAvgOrderByAggregateInput
    _max?: MonitorDeviceHealthMaxOrderByAggregateInput
    _min?: MonitorDeviceHealthMinOrderByAggregateInput
    _sum?: MonitorDeviceHealthSumOrderByAggregateInput
  }

  export type MonitorDeviceHealthScalarWhereWithAggregatesInput = {
    AND?: MonitorDeviceHealthScalarWhereWithAggregatesInput | MonitorDeviceHealthScalarWhereWithAggregatesInput[]
    OR?: MonitorDeviceHealthScalarWhereWithAggregatesInput[]
    NOT?: MonitorDeviceHealthScalarWhereWithAggregatesInput | MonitorDeviceHealthScalarWhereWithAggregatesInput[]
    id?: BigIntWithAggregatesFilter<"MonitorDeviceHealth"> | bigint | number
    organizationId?: StringNullableWithAggregatesFilter<"MonitorDeviceHealth"> | string | null
    employeeId?: StringWithAggregatesFilter<"MonitorDeviceHealth"> | string
    employeeName?: StringNullableWithAggregatesFilter<"MonitorDeviceHealth"> | string | null
    employeeCode?: StringNullableWithAggregatesFilter<"MonitorDeviceHealth"> | string | null
    deviceId?: StringWithAggregatesFilter<"MonitorDeviceHealth"> | string
    hostname?: StringNullableWithAggregatesFilter<"MonitorDeviceHealth"> | string | null
    platform?: StringNullableWithAggregatesFilter<"MonitorDeviceHealth"> | string | null
    platformVersion?: StringNullableWithAggregatesFilter<"MonitorDeviceHealth"> | string | null
    agentVersion?: StringNullableWithAggregatesFilter<"MonitorDeviceHealth"> | string | null
    cpuModel?: StringNullableWithAggregatesFilter<"MonitorDeviceHealth"> | string | null
    cpuCoreCount?: IntNullableWithAggregatesFilter<"MonitorDeviceHealth"> | number | null
    cpuPercent?: DecimalNullableWithAggregatesFilter<"MonitorDeviceHealth"> | Decimal | DecimalJsLike | number | string | null
    memoryTotalBytes?: BigIntNullableWithAggregatesFilter<"MonitorDeviceHealth"> | bigint | number | null
    memoryUsedBytes?: BigIntNullableWithAggregatesFilter<"MonitorDeviceHealth"> | bigint | number | null
    memoryPercent?: DecimalNullableWithAggregatesFilter<"MonitorDeviceHealth"> | Decimal | DecimalJsLike | number | string | null
    disks?: JsonWithAggregatesFilter<"MonitorDeviceHealth">
    temperatureC?: DecimalNullableWithAggregatesFilter<"MonitorDeviceHealth"> | Decimal | DecimalJsLike | number | string | null
    batteryPercent?: DecimalNullableWithAggregatesFilter<"MonitorDeviceHealth"> | Decimal | DecimalJsLike | number | string | null
    batteryCharging?: BoolNullableWithAggregatesFilter<"MonitorDeviceHealth"> | boolean | null
    uptimeSeconds?: BigIntNullableWithAggregatesFilter<"MonitorDeviceHealth"> | bigint | number | null
    lastSeenAt?: DateTimeWithAggregatesFilter<"MonitorDeviceHealth"> | Date | string
    reportedAt?: DateTimeWithAggregatesFilter<"MonitorDeviceHealth"> | Date | string
    createdAt?: DateTimeWithAggregatesFilter<"MonitorDeviceHealth"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"MonitorDeviceHealth"> | Date | string
  }

  export type MonitorScreenshotBatchWhereInput = {
    AND?: MonitorScreenshotBatchWhereInput | MonitorScreenshotBatchWhereInput[]
    OR?: MonitorScreenshotBatchWhereInput[]
    NOT?: MonitorScreenshotBatchWhereInput | MonitorScreenshotBatchWhereInput[]
    id?: StringFilter<"MonitorScreenshotBatch"> | string
    organizationId?: StringNullableFilter<"MonitorScreenshotBatch"> | string | null
    employeeId?: StringFilter<"MonitorScreenshotBatch"> | string
    deviceId?: StringFilter<"MonitorScreenshotBatch"> | string
    status?: StringFilter<"MonitorScreenshotBatch"> | string
    expectedCount?: IntFilter<"MonitorScreenshotBatch"> | number
    uploadedCount?: IntFilter<"MonitorScreenshotBatch"> | number
    duplicateCount?: IntFilter<"MonitorScreenshotBatch"> | number
    expectedBytes?: BigIntFilter<"MonitorScreenshotBatch"> | bigint | number
    uploadedBytes?: BigIntFilter<"MonitorScreenshotBatch"> | bigint | number
    firstCapturedAt?: DateTimeNullableFilter<"MonitorScreenshotBatch"> | Date | string | null
    lastCapturedAt?: DateTimeNullableFilter<"MonitorScreenshotBatch"> | Date | string | null
    createdAt?: DateTimeFilter<"MonitorScreenshotBatch"> | Date | string
    completedAt?: DateTimeNullableFilter<"MonitorScreenshotBatch"> | Date | string | null
    screenshots?: MonitorScreenshotListRelationFilter
  }

  export type MonitorScreenshotBatchOrderByWithRelationInput = {
    id?: SortOrder
    organizationId?: SortOrderInput | SortOrder
    employeeId?: SortOrder
    deviceId?: SortOrder
    status?: SortOrder
    expectedCount?: SortOrder
    uploadedCount?: SortOrder
    duplicateCount?: SortOrder
    expectedBytes?: SortOrder
    uploadedBytes?: SortOrder
    firstCapturedAt?: SortOrderInput | SortOrder
    lastCapturedAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    completedAt?: SortOrderInput | SortOrder
    screenshots?: MonitorScreenshotOrderByRelationAggregateInput
  }

  export type MonitorScreenshotBatchWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    deviceId_id?: MonitorScreenshotBatchDeviceIdIdCompoundUniqueInput
    AND?: MonitorScreenshotBatchWhereInput | MonitorScreenshotBatchWhereInput[]
    OR?: MonitorScreenshotBatchWhereInput[]
    NOT?: MonitorScreenshotBatchWhereInput | MonitorScreenshotBatchWhereInput[]
    organizationId?: StringNullableFilter<"MonitorScreenshotBatch"> | string | null
    employeeId?: StringFilter<"MonitorScreenshotBatch"> | string
    deviceId?: StringFilter<"MonitorScreenshotBatch"> | string
    status?: StringFilter<"MonitorScreenshotBatch"> | string
    expectedCount?: IntFilter<"MonitorScreenshotBatch"> | number
    uploadedCount?: IntFilter<"MonitorScreenshotBatch"> | number
    duplicateCount?: IntFilter<"MonitorScreenshotBatch"> | number
    expectedBytes?: BigIntFilter<"MonitorScreenshotBatch"> | bigint | number
    uploadedBytes?: BigIntFilter<"MonitorScreenshotBatch"> | bigint | number
    firstCapturedAt?: DateTimeNullableFilter<"MonitorScreenshotBatch"> | Date | string | null
    lastCapturedAt?: DateTimeNullableFilter<"MonitorScreenshotBatch"> | Date | string | null
    createdAt?: DateTimeFilter<"MonitorScreenshotBatch"> | Date | string
    completedAt?: DateTimeNullableFilter<"MonitorScreenshotBatch"> | Date | string | null
    screenshots?: MonitorScreenshotListRelationFilter
  }, "id" | "deviceId_id">

  export type MonitorScreenshotBatchOrderByWithAggregationInput = {
    id?: SortOrder
    organizationId?: SortOrderInput | SortOrder
    employeeId?: SortOrder
    deviceId?: SortOrder
    status?: SortOrder
    expectedCount?: SortOrder
    uploadedCount?: SortOrder
    duplicateCount?: SortOrder
    expectedBytes?: SortOrder
    uploadedBytes?: SortOrder
    firstCapturedAt?: SortOrderInput | SortOrder
    lastCapturedAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    completedAt?: SortOrderInput | SortOrder
    _count?: MonitorScreenshotBatchCountOrderByAggregateInput
    _avg?: MonitorScreenshotBatchAvgOrderByAggregateInput
    _max?: MonitorScreenshotBatchMaxOrderByAggregateInput
    _min?: MonitorScreenshotBatchMinOrderByAggregateInput
    _sum?: MonitorScreenshotBatchSumOrderByAggregateInput
  }

  export type MonitorScreenshotBatchScalarWhereWithAggregatesInput = {
    AND?: MonitorScreenshotBatchScalarWhereWithAggregatesInput | MonitorScreenshotBatchScalarWhereWithAggregatesInput[]
    OR?: MonitorScreenshotBatchScalarWhereWithAggregatesInput[]
    NOT?: MonitorScreenshotBatchScalarWhereWithAggregatesInput | MonitorScreenshotBatchScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"MonitorScreenshotBatch"> | string
    organizationId?: StringNullableWithAggregatesFilter<"MonitorScreenshotBatch"> | string | null
    employeeId?: StringWithAggregatesFilter<"MonitorScreenshotBatch"> | string
    deviceId?: StringWithAggregatesFilter<"MonitorScreenshotBatch"> | string
    status?: StringWithAggregatesFilter<"MonitorScreenshotBatch"> | string
    expectedCount?: IntWithAggregatesFilter<"MonitorScreenshotBatch"> | number
    uploadedCount?: IntWithAggregatesFilter<"MonitorScreenshotBatch"> | number
    duplicateCount?: IntWithAggregatesFilter<"MonitorScreenshotBatch"> | number
    expectedBytes?: BigIntWithAggregatesFilter<"MonitorScreenshotBatch"> | bigint | number
    uploadedBytes?: BigIntWithAggregatesFilter<"MonitorScreenshotBatch"> | bigint | number
    firstCapturedAt?: DateTimeNullableWithAggregatesFilter<"MonitorScreenshotBatch"> | Date | string | null
    lastCapturedAt?: DateTimeNullableWithAggregatesFilter<"MonitorScreenshotBatch"> | Date | string | null
    createdAt?: DateTimeWithAggregatesFilter<"MonitorScreenshotBatch"> | Date | string
    completedAt?: DateTimeNullableWithAggregatesFilter<"MonitorScreenshotBatch"> | Date | string | null
  }

  export type MonitorScreenshotWhereInput = {
    AND?: MonitorScreenshotWhereInput | MonitorScreenshotWhereInput[]
    OR?: MonitorScreenshotWhereInput[]
    NOT?: MonitorScreenshotWhereInput | MonitorScreenshotWhereInput[]
    id?: StringFilter<"MonitorScreenshot"> | string
    batchId?: StringNullableFilter<"MonitorScreenshot"> | string | null
    organizationId?: StringNullableFilter<"MonitorScreenshot"> | string | null
    employeeId?: StringFilter<"MonitorScreenshot"> | string
    deviceId?: StringFilter<"MonitorScreenshot"> | string
    clientScreenshotId?: StringFilter<"MonitorScreenshot"> | string
    capturedAt?: DateTimeFilter<"MonitorScreenshot"> | Date | string
    originalFileName?: StringFilter<"MonitorScreenshot"> | string
    mimeType?: StringFilter<"MonitorScreenshot"> | string
    width?: IntNullableFilter<"MonitorScreenshot"> | number | null
    height?: IntNullableFilter<"MonitorScreenshot"> | number | null
    sha256?: StringFilter<"MonitorScreenshot"> | string
    sizeBytes?: BigIntFilter<"MonitorScreenshot"> | bigint | number
    cloudinaryFolder?: StringNullableFilter<"MonitorScreenshot"> | string | null
    cloudinaryPublicId?: StringNullableFilter<"MonitorScreenshot"> | string | null
    cloudinaryAssetId?: StringNullableFilter<"MonitorScreenshot"> | string | null
    cloudinaryVersion?: BigIntNullableFilter<"MonitorScreenshot"> | bigint | number | null
    cloudinaryFormat?: StringNullableFilter<"MonitorScreenshot"> | string | null
    cloudinaryUrl?: StringNullableFilter<"MonitorScreenshot"> | string | null
    duplicateOf?: StringNullableFilter<"MonitorScreenshot"> | string | null
    uploadStatus?: StringFilter<"MonitorScreenshot"> | string
    processingStatus?: StringFilter<"MonitorScreenshot"> | string
    errorMessage?: StringNullableFilter<"MonitorScreenshot"> | string | null
    createdAt?: DateTimeFilter<"MonitorScreenshot"> | Date | string
    uploadedAt?: DateTimeNullableFilter<"MonitorScreenshot"> | Date | string | null
    batch?: XOR<MonitorScreenshotBatchNullableScalarRelationFilter, MonitorScreenshotBatchWhereInput> | null
  }

  export type MonitorScreenshotOrderByWithRelationInput = {
    id?: SortOrder
    batchId?: SortOrderInput | SortOrder
    organizationId?: SortOrderInput | SortOrder
    employeeId?: SortOrder
    deviceId?: SortOrder
    clientScreenshotId?: SortOrder
    capturedAt?: SortOrder
    originalFileName?: SortOrder
    mimeType?: SortOrder
    width?: SortOrderInput | SortOrder
    height?: SortOrderInput | SortOrder
    sha256?: SortOrder
    sizeBytes?: SortOrder
    cloudinaryFolder?: SortOrderInput | SortOrder
    cloudinaryPublicId?: SortOrderInput | SortOrder
    cloudinaryAssetId?: SortOrderInput | SortOrder
    cloudinaryVersion?: SortOrderInput | SortOrder
    cloudinaryFormat?: SortOrderInput | SortOrder
    cloudinaryUrl?: SortOrderInput | SortOrder
    duplicateOf?: SortOrderInput | SortOrder
    uploadStatus?: SortOrder
    processingStatus?: SortOrder
    errorMessage?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    uploadedAt?: SortOrderInput | SortOrder
    batch?: MonitorScreenshotBatchOrderByWithRelationInput
  }

  export type MonitorScreenshotWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    deviceId_clientScreenshotId?: MonitorScreenshotDeviceIdClientScreenshotIdCompoundUniqueInput
    AND?: MonitorScreenshotWhereInput | MonitorScreenshotWhereInput[]
    OR?: MonitorScreenshotWhereInput[]
    NOT?: MonitorScreenshotWhereInput | MonitorScreenshotWhereInput[]
    batchId?: StringNullableFilter<"MonitorScreenshot"> | string | null
    organizationId?: StringNullableFilter<"MonitorScreenshot"> | string | null
    employeeId?: StringFilter<"MonitorScreenshot"> | string
    deviceId?: StringFilter<"MonitorScreenshot"> | string
    clientScreenshotId?: StringFilter<"MonitorScreenshot"> | string
    capturedAt?: DateTimeFilter<"MonitorScreenshot"> | Date | string
    originalFileName?: StringFilter<"MonitorScreenshot"> | string
    mimeType?: StringFilter<"MonitorScreenshot"> | string
    width?: IntNullableFilter<"MonitorScreenshot"> | number | null
    height?: IntNullableFilter<"MonitorScreenshot"> | number | null
    sha256?: StringFilter<"MonitorScreenshot"> | string
    sizeBytes?: BigIntFilter<"MonitorScreenshot"> | bigint | number
    cloudinaryFolder?: StringNullableFilter<"MonitorScreenshot"> | string | null
    cloudinaryPublicId?: StringNullableFilter<"MonitorScreenshot"> | string | null
    cloudinaryAssetId?: StringNullableFilter<"MonitorScreenshot"> | string | null
    cloudinaryVersion?: BigIntNullableFilter<"MonitorScreenshot"> | bigint | number | null
    cloudinaryFormat?: StringNullableFilter<"MonitorScreenshot"> | string | null
    cloudinaryUrl?: StringNullableFilter<"MonitorScreenshot"> | string | null
    duplicateOf?: StringNullableFilter<"MonitorScreenshot"> | string | null
    uploadStatus?: StringFilter<"MonitorScreenshot"> | string
    processingStatus?: StringFilter<"MonitorScreenshot"> | string
    errorMessage?: StringNullableFilter<"MonitorScreenshot"> | string | null
    createdAt?: DateTimeFilter<"MonitorScreenshot"> | Date | string
    uploadedAt?: DateTimeNullableFilter<"MonitorScreenshot"> | Date | string | null
    batch?: XOR<MonitorScreenshotBatchNullableScalarRelationFilter, MonitorScreenshotBatchWhereInput> | null
  }, "id" | "deviceId_clientScreenshotId">

  export type MonitorScreenshotOrderByWithAggregationInput = {
    id?: SortOrder
    batchId?: SortOrderInput | SortOrder
    organizationId?: SortOrderInput | SortOrder
    employeeId?: SortOrder
    deviceId?: SortOrder
    clientScreenshotId?: SortOrder
    capturedAt?: SortOrder
    originalFileName?: SortOrder
    mimeType?: SortOrder
    width?: SortOrderInput | SortOrder
    height?: SortOrderInput | SortOrder
    sha256?: SortOrder
    sizeBytes?: SortOrder
    cloudinaryFolder?: SortOrderInput | SortOrder
    cloudinaryPublicId?: SortOrderInput | SortOrder
    cloudinaryAssetId?: SortOrderInput | SortOrder
    cloudinaryVersion?: SortOrderInput | SortOrder
    cloudinaryFormat?: SortOrderInput | SortOrder
    cloudinaryUrl?: SortOrderInput | SortOrder
    duplicateOf?: SortOrderInput | SortOrder
    uploadStatus?: SortOrder
    processingStatus?: SortOrder
    errorMessage?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    uploadedAt?: SortOrderInput | SortOrder
    _count?: MonitorScreenshotCountOrderByAggregateInput
    _avg?: MonitorScreenshotAvgOrderByAggregateInput
    _max?: MonitorScreenshotMaxOrderByAggregateInput
    _min?: MonitorScreenshotMinOrderByAggregateInput
    _sum?: MonitorScreenshotSumOrderByAggregateInput
  }

  export type MonitorScreenshotScalarWhereWithAggregatesInput = {
    AND?: MonitorScreenshotScalarWhereWithAggregatesInput | MonitorScreenshotScalarWhereWithAggregatesInput[]
    OR?: MonitorScreenshotScalarWhereWithAggregatesInput[]
    NOT?: MonitorScreenshotScalarWhereWithAggregatesInput | MonitorScreenshotScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"MonitorScreenshot"> | string
    batchId?: StringNullableWithAggregatesFilter<"MonitorScreenshot"> | string | null
    organizationId?: StringNullableWithAggregatesFilter<"MonitorScreenshot"> | string | null
    employeeId?: StringWithAggregatesFilter<"MonitorScreenshot"> | string
    deviceId?: StringWithAggregatesFilter<"MonitorScreenshot"> | string
    clientScreenshotId?: StringWithAggregatesFilter<"MonitorScreenshot"> | string
    capturedAt?: DateTimeWithAggregatesFilter<"MonitorScreenshot"> | Date | string
    originalFileName?: StringWithAggregatesFilter<"MonitorScreenshot"> | string
    mimeType?: StringWithAggregatesFilter<"MonitorScreenshot"> | string
    width?: IntNullableWithAggregatesFilter<"MonitorScreenshot"> | number | null
    height?: IntNullableWithAggregatesFilter<"MonitorScreenshot"> | number | null
    sha256?: StringWithAggregatesFilter<"MonitorScreenshot"> | string
    sizeBytes?: BigIntWithAggregatesFilter<"MonitorScreenshot"> | bigint | number
    cloudinaryFolder?: StringNullableWithAggregatesFilter<"MonitorScreenshot"> | string | null
    cloudinaryPublicId?: StringNullableWithAggregatesFilter<"MonitorScreenshot"> | string | null
    cloudinaryAssetId?: StringNullableWithAggregatesFilter<"MonitorScreenshot"> | string | null
    cloudinaryVersion?: BigIntNullableWithAggregatesFilter<"MonitorScreenshot"> | bigint | number | null
    cloudinaryFormat?: StringNullableWithAggregatesFilter<"MonitorScreenshot"> | string | null
    cloudinaryUrl?: StringNullableWithAggregatesFilter<"MonitorScreenshot"> | string | null
    duplicateOf?: StringNullableWithAggregatesFilter<"MonitorScreenshot"> | string | null
    uploadStatus?: StringWithAggregatesFilter<"MonitorScreenshot"> | string
    processingStatus?: StringWithAggregatesFilter<"MonitorScreenshot"> | string
    errorMessage?: StringNullableWithAggregatesFilter<"MonitorScreenshot"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"MonitorScreenshot"> | Date | string
    uploadedAt?: DateTimeNullableWithAggregatesFilter<"MonitorScreenshot"> | Date | string | null
  }

  export type MonitorActivityEventCreateInput = {
    id: string
    dailyKey?: string | null
    organizationId?: string | null
    employeeId: string
    employeeName?: string | null
    employeeCode?: string | null
    deviceId: string
    activityDate?: Date | string | null
    observedAt: Date | string
    status: string
    activeSeconds?: number
    idleSeconds?: number
    eventIds?: MonitorActivityEventCreateeventIdsInput | string[]
    createdAt?: Date | string
  }

  export type MonitorActivityEventUncheckedCreateInput = {
    id: string
    dailyKey?: string | null
    organizationId?: string | null
    employeeId: string
    employeeName?: string | null
    employeeCode?: string | null
    deviceId: string
    activityDate?: Date | string | null
    observedAt: Date | string
    status: string
    activeSeconds?: number
    idleSeconds?: number
    eventIds?: MonitorActivityEventCreateeventIdsInput | string[]
    createdAt?: Date | string
  }

  export type MonitorActivityEventUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    dailyKey?: NullableStringFieldUpdateOperationsInput | string | null
    organizationId?: NullableStringFieldUpdateOperationsInput | string | null
    employeeId?: StringFieldUpdateOperationsInput | string
    employeeName?: NullableStringFieldUpdateOperationsInput | string | null
    employeeCode?: NullableStringFieldUpdateOperationsInput | string | null
    deviceId?: StringFieldUpdateOperationsInput | string
    activityDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    observedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: StringFieldUpdateOperationsInput | string
    activeSeconds?: IntFieldUpdateOperationsInput | number
    idleSeconds?: IntFieldUpdateOperationsInput | number
    eventIds?: MonitorActivityEventUpdateeventIdsInput | string[]
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MonitorActivityEventUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    dailyKey?: NullableStringFieldUpdateOperationsInput | string | null
    organizationId?: NullableStringFieldUpdateOperationsInput | string | null
    employeeId?: StringFieldUpdateOperationsInput | string
    employeeName?: NullableStringFieldUpdateOperationsInput | string | null
    employeeCode?: NullableStringFieldUpdateOperationsInput | string | null
    deviceId?: StringFieldUpdateOperationsInput | string
    activityDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    observedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: StringFieldUpdateOperationsInput | string
    activeSeconds?: IntFieldUpdateOperationsInput | number
    idleSeconds?: IntFieldUpdateOperationsInput | number
    eventIds?: MonitorActivityEventUpdateeventIdsInput | string[]
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MonitorActivityEventCreateManyInput = {
    id: string
    dailyKey?: string | null
    organizationId?: string | null
    employeeId: string
    employeeName?: string | null
    employeeCode?: string | null
    deviceId: string
    activityDate?: Date | string | null
    observedAt: Date | string
    status: string
    activeSeconds?: number
    idleSeconds?: number
    eventIds?: MonitorActivityEventCreateeventIdsInput | string[]
    createdAt?: Date | string
  }

  export type MonitorActivityEventUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    dailyKey?: NullableStringFieldUpdateOperationsInput | string | null
    organizationId?: NullableStringFieldUpdateOperationsInput | string | null
    employeeId?: StringFieldUpdateOperationsInput | string
    employeeName?: NullableStringFieldUpdateOperationsInput | string | null
    employeeCode?: NullableStringFieldUpdateOperationsInput | string | null
    deviceId?: StringFieldUpdateOperationsInput | string
    activityDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    observedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: StringFieldUpdateOperationsInput | string
    activeSeconds?: IntFieldUpdateOperationsInput | number
    idleSeconds?: IntFieldUpdateOperationsInput | number
    eventIds?: MonitorActivityEventUpdateeventIdsInput | string[]
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MonitorActivityEventUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    dailyKey?: NullableStringFieldUpdateOperationsInput | string | null
    organizationId?: NullableStringFieldUpdateOperationsInput | string | null
    employeeId?: StringFieldUpdateOperationsInput | string
    employeeName?: NullableStringFieldUpdateOperationsInput | string | null
    employeeCode?: NullableStringFieldUpdateOperationsInput | string | null
    deviceId?: StringFieldUpdateOperationsInput | string
    activityDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    observedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: StringFieldUpdateOperationsInput | string
    activeSeconds?: IntFieldUpdateOperationsInput | number
    idleSeconds?: IntFieldUpdateOperationsInput | number
    eventIds?: MonitorActivityEventUpdateeventIdsInput | string[]
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MonitorDevicePresenceCreateInput = {
    deviceId: string
    organizationId?: string | null
    employeeId: string
    employeeName?: string | null
    status: string
    lastSeenAt: Date | string
    updatedAt?: Date | string
  }

  export type MonitorDevicePresenceUncheckedCreateInput = {
    deviceId: string
    organizationId?: string | null
    employeeId: string
    employeeName?: string | null
    status: string
    lastSeenAt: Date | string
    updatedAt?: Date | string
  }

  export type MonitorDevicePresenceUpdateInput = {
    deviceId?: StringFieldUpdateOperationsInput | string
    organizationId?: NullableStringFieldUpdateOperationsInput | string | null
    employeeId?: StringFieldUpdateOperationsInput | string
    employeeName?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    lastSeenAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MonitorDevicePresenceUncheckedUpdateInput = {
    deviceId?: StringFieldUpdateOperationsInput | string
    organizationId?: NullableStringFieldUpdateOperationsInput | string | null
    employeeId?: StringFieldUpdateOperationsInput | string
    employeeName?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    lastSeenAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MonitorDevicePresenceCreateManyInput = {
    deviceId: string
    organizationId?: string | null
    employeeId: string
    employeeName?: string | null
    status: string
    lastSeenAt: Date | string
    updatedAt?: Date | string
  }

  export type MonitorDevicePresenceUpdateManyMutationInput = {
    deviceId?: StringFieldUpdateOperationsInput | string
    organizationId?: NullableStringFieldUpdateOperationsInput | string | null
    employeeId?: StringFieldUpdateOperationsInput | string
    employeeName?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    lastSeenAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MonitorDevicePresenceUncheckedUpdateManyInput = {
    deviceId?: StringFieldUpdateOperationsInput | string
    organizationId?: NullableStringFieldUpdateOperationsInput | string | null
    employeeId?: StringFieldUpdateOperationsInput | string
    employeeName?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    lastSeenAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MonitorBrowserHistoryCreateInput = {
    entryId: string
    organizationId?: string | null
    employeeId: string
    employeeName?: string | null
    deviceId: string
    observedAt: Date | string
    browser: string
    url: string
    title?: string
    activeWindowTitle?: string | null
    durationMs?: number
    createdAt?: Date | string
  }

  export type MonitorBrowserHistoryUncheckedCreateInput = {
    entryId: string
    organizationId?: string | null
    employeeId: string
    employeeName?: string | null
    deviceId: string
    observedAt: Date | string
    browser: string
    url: string
    title?: string
    activeWindowTitle?: string | null
    durationMs?: number
    createdAt?: Date | string
  }

  export type MonitorBrowserHistoryUpdateInput = {
    entryId?: StringFieldUpdateOperationsInput | string
    organizationId?: NullableStringFieldUpdateOperationsInput | string | null
    employeeId?: StringFieldUpdateOperationsInput | string
    employeeName?: NullableStringFieldUpdateOperationsInput | string | null
    deviceId?: StringFieldUpdateOperationsInput | string
    observedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    browser?: StringFieldUpdateOperationsInput | string
    url?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    activeWindowTitle?: NullableStringFieldUpdateOperationsInput | string | null
    durationMs?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MonitorBrowserHistoryUncheckedUpdateInput = {
    entryId?: StringFieldUpdateOperationsInput | string
    organizationId?: NullableStringFieldUpdateOperationsInput | string | null
    employeeId?: StringFieldUpdateOperationsInput | string
    employeeName?: NullableStringFieldUpdateOperationsInput | string | null
    deviceId?: StringFieldUpdateOperationsInput | string
    observedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    browser?: StringFieldUpdateOperationsInput | string
    url?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    activeWindowTitle?: NullableStringFieldUpdateOperationsInput | string | null
    durationMs?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MonitorBrowserHistoryCreateManyInput = {
    entryId: string
    organizationId?: string | null
    employeeId: string
    employeeName?: string | null
    deviceId: string
    observedAt: Date | string
    browser: string
    url: string
    title?: string
    activeWindowTitle?: string | null
    durationMs?: number
    createdAt?: Date | string
  }

  export type MonitorBrowserHistoryUpdateManyMutationInput = {
    entryId?: StringFieldUpdateOperationsInput | string
    organizationId?: NullableStringFieldUpdateOperationsInput | string | null
    employeeId?: StringFieldUpdateOperationsInput | string
    employeeName?: NullableStringFieldUpdateOperationsInput | string | null
    deviceId?: StringFieldUpdateOperationsInput | string
    observedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    browser?: StringFieldUpdateOperationsInput | string
    url?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    activeWindowTitle?: NullableStringFieldUpdateOperationsInput | string | null
    durationMs?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MonitorBrowserHistoryUncheckedUpdateManyInput = {
    entryId?: StringFieldUpdateOperationsInput | string
    organizationId?: NullableStringFieldUpdateOperationsInput | string | null
    employeeId?: StringFieldUpdateOperationsInput | string
    employeeName?: NullableStringFieldUpdateOperationsInput | string | null
    deviceId?: StringFieldUpdateOperationsInput | string
    observedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    browser?: StringFieldUpdateOperationsInput | string
    url?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    activeWindowTitle?: NullableStringFieldUpdateOperationsInput | string | null
    durationMs?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MonitorAppUsageSessionCreateInput = {
    sessionId: string
    organizationId?: string | null
    employeeId: string
    employeeName?: string | null
    employeeCode?: string | null
    deviceId: string
    observedAt: Date | string
    appName: string
    processName: string
    startedAt: Date | string
    endedAt: Date | string
    activeSeconds?: number
    keyPressCount?: number
    keyNames?: JsonNullValueInput | InputJsonValue
    typedText?: string
    keyStreamText?: string
    uploadStatus?: string
    retryCount?: number
    lastError?: string | null
    createdAt?: Date | string
    uploadedAt?: Date | string | null
  }

  export type MonitorAppUsageSessionUncheckedCreateInput = {
    sessionId: string
    organizationId?: string | null
    employeeId: string
    employeeName?: string | null
    employeeCode?: string | null
    deviceId: string
    observedAt: Date | string
    appName: string
    processName: string
    startedAt: Date | string
    endedAt: Date | string
    activeSeconds?: number
    keyPressCount?: number
    keyNames?: JsonNullValueInput | InputJsonValue
    typedText?: string
    keyStreamText?: string
    uploadStatus?: string
    retryCount?: number
    lastError?: string | null
    createdAt?: Date | string
    uploadedAt?: Date | string | null
  }

  export type MonitorAppUsageSessionUpdateInput = {
    sessionId?: StringFieldUpdateOperationsInput | string
    organizationId?: NullableStringFieldUpdateOperationsInput | string | null
    employeeId?: StringFieldUpdateOperationsInput | string
    employeeName?: NullableStringFieldUpdateOperationsInput | string | null
    employeeCode?: NullableStringFieldUpdateOperationsInput | string | null
    deviceId?: StringFieldUpdateOperationsInput | string
    observedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    appName?: StringFieldUpdateOperationsInput | string
    processName?: StringFieldUpdateOperationsInput | string
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    endedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    activeSeconds?: IntFieldUpdateOperationsInput | number
    keyPressCount?: IntFieldUpdateOperationsInput | number
    keyNames?: JsonNullValueInput | InputJsonValue
    typedText?: StringFieldUpdateOperationsInput | string
    keyStreamText?: StringFieldUpdateOperationsInput | string
    uploadStatus?: StringFieldUpdateOperationsInput | string
    retryCount?: IntFieldUpdateOperationsInput | number
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    uploadedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type MonitorAppUsageSessionUncheckedUpdateInput = {
    sessionId?: StringFieldUpdateOperationsInput | string
    organizationId?: NullableStringFieldUpdateOperationsInput | string | null
    employeeId?: StringFieldUpdateOperationsInput | string
    employeeName?: NullableStringFieldUpdateOperationsInput | string | null
    employeeCode?: NullableStringFieldUpdateOperationsInput | string | null
    deviceId?: StringFieldUpdateOperationsInput | string
    observedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    appName?: StringFieldUpdateOperationsInput | string
    processName?: StringFieldUpdateOperationsInput | string
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    endedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    activeSeconds?: IntFieldUpdateOperationsInput | number
    keyPressCount?: IntFieldUpdateOperationsInput | number
    keyNames?: JsonNullValueInput | InputJsonValue
    typedText?: StringFieldUpdateOperationsInput | string
    keyStreamText?: StringFieldUpdateOperationsInput | string
    uploadStatus?: StringFieldUpdateOperationsInput | string
    retryCount?: IntFieldUpdateOperationsInput | number
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    uploadedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type MonitorAppUsageSessionCreateManyInput = {
    sessionId: string
    organizationId?: string | null
    employeeId: string
    employeeName?: string | null
    employeeCode?: string | null
    deviceId: string
    observedAt: Date | string
    appName: string
    processName: string
    startedAt: Date | string
    endedAt: Date | string
    activeSeconds?: number
    keyPressCount?: number
    keyNames?: JsonNullValueInput | InputJsonValue
    typedText?: string
    keyStreamText?: string
    uploadStatus?: string
    retryCount?: number
    lastError?: string | null
    createdAt?: Date | string
    uploadedAt?: Date | string | null
  }

  export type MonitorAppUsageSessionUpdateManyMutationInput = {
    sessionId?: StringFieldUpdateOperationsInput | string
    organizationId?: NullableStringFieldUpdateOperationsInput | string | null
    employeeId?: StringFieldUpdateOperationsInput | string
    employeeName?: NullableStringFieldUpdateOperationsInput | string | null
    employeeCode?: NullableStringFieldUpdateOperationsInput | string | null
    deviceId?: StringFieldUpdateOperationsInput | string
    observedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    appName?: StringFieldUpdateOperationsInput | string
    processName?: StringFieldUpdateOperationsInput | string
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    endedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    activeSeconds?: IntFieldUpdateOperationsInput | number
    keyPressCount?: IntFieldUpdateOperationsInput | number
    keyNames?: JsonNullValueInput | InputJsonValue
    typedText?: StringFieldUpdateOperationsInput | string
    keyStreamText?: StringFieldUpdateOperationsInput | string
    uploadStatus?: StringFieldUpdateOperationsInput | string
    retryCount?: IntFieldUpdateOperationsInput | number
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    uploadedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type MonitorAppUsageSessionUncheckedUpdateManyInput = {
    sessionId?: StringFieldUpdateOperationsInput | string
    organizationId?: NullableStringFieldUpdateOperationsInput | string | null
    employeeId?: StringFieldUpdateOperationsInput | string
    employeeName?: NullableStringFieldUpdateOperationsInput | string | null
    employeeCode?: NullableStringFieldUpdateOperationsInput | string | null
    deviceId?: StringFieldUpdateOperationsInput | string
    observedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    appName?: StringFieldUpdateOperationsInput | string
    processName?: StringFieldUpdateOperationsInput | string
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    endedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    activeSeconds?: IntFieldUpdateOperationsInput | number
    keyPressCount?: IntFieldUpdateOperationsInput | number
    keyNames?: JsonNullValueInput | InputJsonValue
    typedText?: StringFieldUpdateOperationsInput | string
    keyStreamText?: StringFieldUpdateOperationsInput | string
    uploadStatus?: StringFieldUpdateOperationsInput | string
    retryCount?: IntFieldUpdateOperationsInput | number
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    uploadedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type MonitorCloudinarySettingCreateInput = {
    organizationId: string
    cloudName: string
    apiKey: string
    apiSecretCiphertext: string
    apiSecretIv: string
    apiSecretAuthTag: string
    uploadFolderRoot?: string
    screenshotsEnabled?: boolean
    mouseEnabled?: boolean
    keyboardEnabled?: boolean
    appUsageEnabled?: boolean
    browserHistoryEnabled?: boolean
    usbEnabled?: boolean
    screenshotIntervalMinutes?: number
    mouseHeartbeatMinutes?: number
    mouseIdleThresholdMinutes?: number
    keyboardHeartbeatMinutes?: number
    appUsageHeartbeatMinutes?: number
    browserHistorySyncMinutes?: number
    updatedAt?: Date | string
  }

  export type MonitorCloudinarySettingUncheckedCreateInput = {
    organizationId: string
    cloudName: string
    apiKey: string
    apiSecretCiphertext: string
    apiSecretIv: string
    apiSecretAuthTag: string
    uploadFolderRoot?: string
    screenshotsEnabled?: boolean
    mouseEnabled?: boolean
    keyboardEnabled?: boolean
    appUsageEnabled?: boolean
    browserHistoryEnabled?: boolean
    usbEnabled?: boolean
    screenshotIntervalMinutes?: number
    mouseHeartbeatMinutes?: number
    mouseIdleThresholdMinutes?: number
    keyboardHeartbeatMinutes?: number
    appUsageHeartbeatMinutes?: number
    browserHistorySyncMinutes?: number
    updatedAt?: Date | string
  }

  export type MonitorCloudinarySettingUpdateInput = {
    organizationId?: StringFieldUpdateOperationsInput | string
    cloudName?: StringFieldUpdateOperationsInput | string
    apiKey?: StringFieldUpdateOperationsInput | string
    apiSecretCiphertext?: StringFieldUpdateOperationsInput | string
    apiSecretIv?: StringFieldUpdateOperationsInput | string
    apiSecretAuthTag?: StringFieldUpdateOperationsInput | string
    uploadFolderRoot?: StringFieldUpdateOperationsInput | string
    screenshotsEnabled?: BoolFieldUpdateOperationsInput | boolean
    mouseEnabled?: BoolFieldUpdateOperationsInput | boolean
    keyboardEnabled?: BoolFieldUpdateOperationsInput | boolean
    appUsageEnabled?: BoolFieldUpdateOperationsInput | boolean
    browserHistoryEnabled?: BoolFieldUpdateOperationsInput | boolean
    usbEnabled?: BoolFieldUpdateOperationsInput | boolean
    screenshotIntervalMinutes?: IntFieldUpdateOperationsInput | number
    mouseHeartbeatMinutes?: IntFieldUpdateOperationsInput | number
    mouseIdleThresholdMinutes?: IntFieldUpdateOperationsInput | number
    keyboardHeartbeatMinutes?: IntFieldUpdateOperationsInput | number
    appUsageHeartbeatMinutes?: IntFieldUpdateOperationsInput | number
    browserHistorySyncMinutes?: IntFieldUpdateOperationsInput | number
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MonitorCloudinarySettingUncheckedUpdateInput = {
    organizationId?: StringFieldUpdateOperationsInput | string
    cloudName?: StringFieldUpdateOperationsInput | string
    apiKey?: StringFieldUpdateOperationsInput | string
    apiSecretCiphertext?: StringFieldUpdateOperationsInput | string
    apiSecretIv?: StringFieldUpdateOperationsInput | string
    apiSecretAuthTag?: StringFieldUpdateOperationsInput | string
    uploadFolderRoot?: StringFieldUpdateOperationsInput | string
    screenshotsEnabled?: BoolFieldUpdateOperationsInput | boolean
    mouseEnabled?: BoolFieldUpdateOperationsInput | boolean
    keyboardEnabled?: BoolFieldUpdateOperationsInput | boolean
    appUsageEnabled?: BoolFieldUpdateOperationsInput | boolean
    browserHistoryEnabled?: BoolFieldUpdateOperationsInput | boolean
    usbEnabled?: BoolFieldUpdateOperationsInput | boolean
    screenshotIntervalMinutes?: IntFieldUpdateOperationsInput | number
    mouseHeartbeatMinutes?: IntFieldUpdateOperationsInput | number
    mouseIdleThresholdMinutes?: IntFieldUpdateOperationsInput | number
    keyboardHeartbeatMinutes?: IntFieldUpdateOperationsInput | number
    appUsageHeartbeatMinutes?: IntFieldUpdateOperationsInput | number
    browserHistorySyncMinutes?: IntFieldUpdateOperationsInput | number
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MonitorCloudinarySettingCreateManyInput = {
    organizationId: string
    cloudName: string
    apiKey: string
    apiSecretCiphertext: string
    apiSecretIv: string
    apiSecretAuthTag: string
    uploadFolderRoot?: string
    screenshotsEnabled?: boolean
    mouseEnabled?: boolean
    keyboardEnabled?: boolean
    appUsageEnabled?: boolean
    browserHistoryEnabled?: boolean
    usbEnabled?: boolean
    screenshotIntervalMinutes?: number
    mouseHeartbeatMinutes?: number
    mouseIdleThresholdMinutes?: number
    keyboardHeartbeatMinutes?: number
    appUsageHeartbeatMinutes?: number
    browserHistorySyncMinutes?: number
    updatedAt?: Date | string
  }

  export type MonitorCloudinarySettingUpdateManyMutationInput = {
    organizationId?: StringFieldUpdateOperationsInput | string
    cloudName?: StringFieldUpdateOperationsInput | string
    apiKey?: StringFieldUpdateOperationsInput | string
    apiSecretCiphertext?: StringFieldUpdateOperationsInput | string
    apiSecretIv?: StringFieldUpdateOperationsInput | string
    apiSecretAuthTag?: StringFieldUpdateOperationsInput | string
    uploadFolderRoot?: StringFieldUpdateOperationsInput | string
    screenshotsEnabled?: BoolFieldUpdateOperationsInput | boolean
    mouseEnabled?: BoolFieldUpdateOperationsInput | boolean
    keyboardEnabled?: BoolFieldUpdateOperationsInput | boolean
    appUsageEnabled?: BoolFieldUpdateOperationsInput | boolean
    browserHistoryEnabled?: BoolFieldUpdateOperationsInput | boolean
    usbEnabled?: BoolFieldUpdateOperationsInput | boolean
    screenshotIntervalMinutes?: IntFieldUpdateOperationsInput | number
    mouseHeartbeatMinutes?: IntFieldUpdateOperationsInput | number
    mouseIdleThresholdMinutes?: IntFieldUpdateOperationsInput | number
    keyboardHeartbeatMinutes?: IntFieldUpdateOperationsInput | number
    appUsageHeartbeatMinutes?: IntFieldUpdateOperationsInput | number
    browserHistorySyncMinutes?: IntFieldUpdateOperationsInput | number
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MonitorCloudinarySettingUncheckedUpdateManyInput = {
    organizationId?: StringFieldUpdateOperationsInput | string
    cloudName?: StringFieldUpdateOperationsInput | string
    apiKey?: StringFieldUpdateOperationsInput | string
    apiSecretCiphertext?: StringFieldUpdateOperationsInput | string
    apiSecretIv?: StringFieldUpdateOperationsInput | string
    apiSecretAuthTag?: StringFieldUpdateOperationsInput | string
    uploadFolderRoot?: StringFieldUpdateOperationsInput | string
    screenshotsEnabled?: BoolFieldUpdateOperationsInput | boolean
    mouseEnabled?: BoolFieldUpdateOperationsInput | boolean
    keyboardEnabled?: BoolFieldUpdateOperationsInput | boolean
    appUsageEnabled?: BoolFieldUpdateOperationsInput | boolean
    browserHistoryEnabled?: BoolFieldUpdateOperationsInput | boolean
    usbEnabled?: BoolFieldUpdateOperationsInput | boolean
    screenshotIntervalMinutes?: IntFieldUpdateOperationsInput | number
    mouseHeartbeatMinutes?: IntFieldUpdateOperationsInput | number
    mouseIdleThresholdMinutes?: IntFieldUpdateOperationsInput | number
    keyboardHeartbeatMinutes?: IntFieldUpdateOperationsInput | number
    appUsageHeartbeatMinutes?: IntFieldUpdateOperationsInput | number
    browserHistorySyncMinutes?: IntFieldUpdateOperationsInput | number
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MonitorDeviceHealthCreateInput = {
    id?: bigint | number
    organizationId?: string | null
    employeeId: string
    employeeName?: string | null
    employeeCode?: string | null
    deviceId: string
    hostname?: string | null
    platform?: string | null
    platformVersion?: string | null
    agentVersion?: string | null
    cpuModel?: string | null
    cpuCoreCount?: number | null
    cpuPercent?: Decimal | DecimalJsLike | number | string | null
    memoryTotalBytes?: bigint | number | null
    memoryUsedBytes?: bigint | number | null
    memoryPercent?: Decimal | DecimalJsLike | number | string | null
    disks?: JsonNullValueInput | InputJsonValue
    temperatureC?: Decimal | DecimalJsLike | number | string | null
    batteryPercent?: Decimal | DecimalJsLike | number | string | null
    batteryCharging?: boolean | null
    uptimeSeconds?: bigint | number | null
    lastSeenAt: Date | string
    reportedAt: Date | string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type MonitorDeviceHealthUncheckedCreateInput = {
    id?: bigint | number
    organizationId?: string | null
    employeeId: string
    employeeName?: string | null
    employeeCode?: string | null
    deviceId: string
    hostname?: string | null
    platform?: string | null
    platformVersion?: string | null
    agentVersion?: string | null
    cpuModel?: string | null
    cpuCoreCount?: number | null
    cpuPercent?: Decimal | DecimalJsLike | number | string | null
    memoryTotalBytes?: bigint | number | null
    memoryUsedBytes?: bigint | number | null
    memoryPercent?: Decimal | DecimalJsLike | number | string | null
    disks?: JsonNullValueInput | InputJsonValue
    temperatureC?: Decimal | DecimalJsLike | number | string | null
    batteryPercent?: Decimal | DecimalJsLike | number | string | null
    batteryCharging?: boolean | null
    uptimeSeconds?: bigint | number | null
    lastSeenAt: Date | string
    reportedAt: Date | string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type MonitorDeviceHealthUpdateInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    organizationId?: NullableStringFieldUpdateOperationsInput | string | null
    employeeId?: StringFieldUpdateOperationsInput | string
    employeeName?: NullableStringFieldUpdateOperationsInput | string | null
    employeeCode?: NullableStringFieldUpdateOperationsInput | string | null
    deviceId?: StringFieldUpdateOperationsInput | string
    hostname?: NullableStringFieldUpdateOperationsInput | string | null
    platform?: NullableStringFieldUpdateOperationsInput | string | null
    platformVersion?: NullableStringFieldUpdateOperationsInput | string | null
    agentVersion?: NullableStringFieldUpdateOperationsInput | string | null
    cpuModel?: NullableStringFieldUpdateOperationsInput | string | null
    cpuCoreCount?: NullableIntFieldUpdateOperationsInput | number | null
    cpuPercent?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    memoryTotalBytes?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
    memoryUsedBytes?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
    memoryPercent?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    disks?: JsonNullValueInput | InputJsonValue
    temperatureC?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    batteryPercent?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    batteryCharging?: NullableBoolFieldUpdateOperationsInput | boolean | null
    uptimeSeconds?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
    lastSeenAt?: DateTimeFieldUpdateOperationsInput | Date | string
    reportedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MonitorDeviceHealthUncheckedUpdateInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    organizationId?: NullableStringFieldUpdateOperationsInput | string | null
    employeeId?: StringFieldUpdateOperationsInput | string
    employeeName?: NullableStringFieldUpdateOperationsInput | string | null
    employeeCode?: NullableStringFieldUpdateOperationsInput | string | null
    deviceId?: StringFieldUpdateOperationsInput | string
    hostname?: NullableStringFieldUpdateOperationsInput | string | null
    platform?: NullableStringFieldUpdateOperationsInput | string | null
    platformVersion?: NullableStringFieldUpdateOperationsInput | string | null
    agentVersion?: NullableStringFieldUpdateOperationsInput | string | null
    cpuModel?: NullableStringFieldUpdateOperationsInput | string | null
    cpuCoreCount?: NullableIntFieldUpdateOperationsInput | number | null
    cpuPercent?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    memoryTotalBytes?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
    memoryUsedBytes?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
    memoryPercent?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    disks?: JsonNullValueInput | InputJsonValue
    temperatureC?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    batteryPercent?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    batteryCharging?: NullableBoolFieldUpdateOperationsInput | boolean | null
    uptimeSeconds?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
    lastSeenAt?: DateTimeFieldUpdateOperationsInput | Date | string
    reportedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MonitorDeviceHealthCreateManyInput = {
    id?: bigint | number
    organizationId?: string | null
    employeeId: string
    employeeName?: string | null
    employeeCode?: string | null
    deviceId: string
    hostname?: string | null
    platform?: string | null
    platformVersion?: string | null
    agentVersion?: string | null
    cpuModel?: string | null
    cpuCoreCount?: number | null
    cpuPercent?: Decimal | DecimalJsLike | number | string | null
    memoryTotalBytes?: bigint | number | null
    memoryUsedBytes?: bigint | number | null
    memoryPercent?: Decimal | DecimalJsLike | number | string | null
    disks?: JsonNullValueInput | InputJsonValue
    temperatureC?: Decimal | DecimalJsLike | number | string | null
    batteryPercent?: Decimal | DecimalJsLike | number | string | null
    batteryCharging?: boolean | null
    uptimeSeconds?: bigint | number | null
    lastSeenAt: Date | string
    reportedAt: Date | string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type MonitorDeviceHealthUpdateManyMutationInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    organizationId?: NullableStringFieldUpdateOperationsInput | string | null
    employeeId?: StringFieldUpdateOperationsInput | string
    employeeName?: NullableStringFieldUpdateOperationsInput | string | null
    employeeCode?: NullableStringFieldUpdateOperationsInput | string | null
    deviceId?: StringFieldUpdateOperationsInput | string
    hostname?: NullableStringFieldUpdateOperationsInput | string | null
    platform?: NullableStringFieldUpdateOperationsInput | string | null
    platformVersion?: NullableStringFieldUpdateOperationsInput | string | null
    agentVersion?: NullableStringFieldUpdateOperationsInput | string | null
    cpuModel?: NullableStringFieldUpdateOperationsInput | string | null
    cpuCoreCount?: NullableIntFieldUpdateOperationsInput | number | null
    cpuPercent?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    memoryTotalBytes?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
    memoryUsedBytes?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
    memoryPercent?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    disks?: JsonNullValueInput | InputJsonValue
    temperatureC?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    batteryPercent?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    batteryCharging?: NullableBoolFieldUpdateOperationsInput | boolean | null
    uptimeSeconds?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
    lastSeenAt?: DateTimeFieldUpdateOperationsInput | Date | string
    reportedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MonitorDeviceHealthUncheckedUpdateManyInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    organizationId?: NullableStringFieldUpdateOperationsInput | string | null
    employeeId?: StringFieldUpdateOperationsInput | string
    employeeName?: NullableStringFieldUpdateOperationsInput | string | null
    employeeCode?: NullableStringFieldUpdateOperationsInput | string | null
    deviceId?: StringFieldUpdateOperationsInput | string
    hostname?: NullableStringFieldUpdateOperationsInput | string | null
    platform?: NullableStringFieldUpdateOperationsInput | string | null
    platformVersion?: NullableStringFieldUpdateOperationsInput | string | null
    agentVersion?: NullableStringFieldUpdateOperationsInput | string | null
    cpuModel?: NullableStringFieldUpdateOperationsInput | string | null
    cpuCoreCount?: NullableIntFieldUpdateOperationsInput | number | null
    cpuPercent?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    memoryTotalBytes?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
    memoryUsedBytes?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
    memoryPercent?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    disks?: JsonNullValueInput | InputJsonValue
    temperatureC?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    batteryPercent?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    batteryCharging?: NullableBoolFieldUpdateOperationsInput | boolean | null
    uptimeSeconds?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
    lastSeenAt?: DateTimeFieldUpdateOperationsInput | Date | string
    reportedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MonitorScreenshotBatchCreateInput = {
    id: string
    organizationId?: string | null
    employeeId: string
    deviceId: string
    status?: string
    expectedCount?: number
    uploadedCount?: number
    duplicateCount?: number
    expectedBytes?: bigint | number
    uploadedBytes?: bigint | number
    firstCapturedAt?: Date | string | null
    lastCapturedAt?: Date | string | null
    createdAt?: Date | string
    completedAt?: Date | string | null
    screenshots?: MonitorScreenshotCreateNestedManyWithoutBatchInput
  }

  export type MonitorScreenshotBatchUncheckedCreateInput = {
    id: string
    organizationId?: string | null
    employeeId: string
    deviceId: string
    status?: string
    expectedCount?: number
    uploadedCount?: number
    duplicateCount?: number
    expectedBytes?: bigint | number
    uploadedBytes?: bigint | number
    firstCapturedAt?: Date | string | null
    lastCapturedAt?: Date | string | null
    createdAt?: Date | string
    completedAt?: Date | string | null
    screenshots?: MonitorScreenshotUncheckedCreateNestedManyWithoutBatchInput
  }

  export type MonitorScreenshotBatchUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    organizationId?: NullableStringFieldUpdateOperationsInput | string | null
    employeeId?: StringFieldUpdateOperationsInput | string
    deviceId?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    expectedCount?: IntFieldUpdateOperationsInput | number
    uploadedCount?: IntFieldUpdateOperationsInput | number
    duplicateCount?: IntFieldUpdateOperationsInput | number
    expectedBytes?: BigIntFieldUpdateOperationsInput | bigint | number
    uploadedBytes?: BigIntFieldUpdateOperationsInput | bigint | number
    firstCapturedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastCapturedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    screenshots?: MonitorScreenshotUpdateManyWithoutBatchNestedInput
  }

  export type MonitorScreenshotBatchUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    organizationId?: NullableStringFieldUpdateOperationsInput | string | null
    employeeId?: StringFieldUpdateOperationsInput | string
    deviceId?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    expectedCount?: IntFieldUpdateOperationsInput | number
    uploadedCount?: IntFieldUpdateOperationsInput | number
    duplicateCount?: IntFieldUpdateOperationsInput | number
    expectedBytes?: BigIntFieldUpdateOperationsInput | bigint | number
    uploadedBytes?: BigIntFieldUpdateOperationsInput | bigint | number
    firstCapturedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastCapturedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    screenshots?: MonitorScreenshotUncheckedUpdateManyWithoutBatchNestedInput
  }

  export type MonitorScreenshotBatchCreateManyInput = {
    id: string
    organizationId?: string | null
    employeeId: string
    deviceId: string
    status?: string
    expectedCount?: number
    uploadedCount?: number
    duplicateCount?: number
    expectedBytes?: bigint | number
    uploadedBytes?: bigint | number
    firstCapturedAt?: Date | string | null
    lastCapturedAt?: Date | string | null
    createdAt?: Date | string
    completedAt?: Date | string | null
  }

  export type MonitorScreenshotBatchUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    organizationId?: NullableStringFieldUpdateOperationsInput | string | null
    employeeId?: StringFieldUpdateOperationsInput | string
    deviceId?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    expectedCount?: IntFieldUpdateOperationsInput | number
    uploadedCount?: IntFieldUpdateOperationsInput | number
    duplicateCount?: IntFieldUpdateOperationsInput | number
    expectedBytes?: BigIntFieldUpdateOperationsInput | bigint | number
    uploadedBytes?: BigIntFieldUpdateOperationsInput | bigint | number
    firstCapturedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastCapturedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type MonitorScreenshotBatchUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    organizationId?: NullableStringFieldUpdateOperationsInput | string | null
    employeeId?: StringFieldUpdateOperationsInput | string
    deviceId?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    expectedCount?: IntFieldUpdateOperationsInput | number
    uploadedCount?: IntFieldUpdateOperationsInput | number
    duplicateCount?: IntFieldUpdateOperationsInput | number
    expectedBytes?: BigIntFieldUpdateOperationsInput | bigint | number
    uploadedBytes?: BigIntFieldUpdateOperationsInput | bigint | number
    firstCapturedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastCapturedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type MonitorScreenshotCreateInput = {
    id: string
    organizationId?: string | null
    employeeId: string
    deviceId: string
    clientScreenshotId: string
    capturedAt: Date | string
    originalFileName: string
    mimeType: string
    width?: number | null
    height?: number | null
    sha256: string
    sizeBytes?: bigint | number
    cloudinaryFolder?: string | null
    cloudinaryPublicId?: string | null
    cloudinaryAssetId?: string | null
    cloudinaryVersion?: bigint | number | null
    cloudinaryFormat?: string | null
    cloudinaryUrl?: string | null
    duplicateOf?: string | null
    uploadStatus?: string
    processingStatus?: string
    errorMessage?: string | null
    createdAt?: Date | string
    uploadedAt?: Date | string | null
    batch?: MonitorScreenshotBatchCreateNestedOneWithoutScreenshotsInput
  }

  export type MonitorScreenshotUncheckedCreateInput = {
    id: string
    batchId?: string | null
    organizationId?: string | null
    employeeId: string
    deviceId: string
    clientScreenshotId: string
    capturedAt: Date | string
    originalFileName: string
    mimeType: string
    width?: number | null
    height?: number | null
    sha256: string
    sizeBytes?: bigint | number
    cloudinaryFolder?: string | null
    cloudinaryPublicId?: string | null
    cloudinaryAssetId?: string | null
    cloudinaryVersion?: bigint | number | null
    cloudinaryFormat?: string | null
    cloudinaryUrl?: string | null
    duplicateOf?: string | null
    uploadStatus?: string
    processingStatus?: string
    errorMessage?: string | null
    createdAt?: Date | string
    uploadedAt?: Date | string | null
  }

  export type MonitorScreenshotUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    organizationId?: NullableStringFieldUpdateOperationsInput | string | null
    employeeId?: StringFieldUpdateOperationsInput | string
    deviceId?: StringFieldUpdateOperationsInput | string
    clientScreenshotId?: StringFieldUpdateOperationsInput | string
    capturedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    originalFileName?: StringFieldUpdateOperationsInput | string
    mimeType?: StringFieldUpdateOperationsInput | string
    width?: NullableIntFieldUpdateOperationsInput | number | null
    height?: NullableIntFieldUpdateOperationsInput | number | null
    sha256?: StringFieldUpdateOperationsInput | string
    sizeBytes?: BigIntFieldUpdateOperationsInput | bigint | number
    cloudinaryFolder?: NullableStringFieldUpdateOperationsInput | string | null
    cloudinaryPublicId?: NullableStringFieldUpdateOperationsInput | string | null
    cloudinaryAssetId?: NullableStringFieldUpdateOperationsInput | string | null
    cloudinaryVersion?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
    cloudinaryFormat?: NullableStringFieldUpdateOperationsInput | string | null
    cloudinaryUrl?: NullableStringFieldUpdateOperationsInput | string | null
    duplicateOf?: NullableStringFieldUpdateOperationsInput | string | null
    uploadStatus?: StringFieldUpdateOperationsInput | string
    processingStatus?: StringFieldUpdateOperationsInput | string
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    uploadedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    batch?: MonitorScreenshotBatchUpdateOneWithoutScreenshotsNestedInput
  }

  export type MonitorScreenshotUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    batchId?: NullableStringFieldUpdateOperationsInput | string | null
    organizationId?: NullableStringFieldUpdateOperationsInput | string | null
    employeeId?: StringFieldUpdateOperationsInput | string
    deviceId?: StringFieldUpdateOperationsInput | string
    clientScreenshotId?: StringFieldUpdateOperationsInput | string
    capturedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    originalFileName?: StringFieldUpdateOperationsInput | string
    mimeType?: StringFieldUpdateOperationsInput | string
    width?: NullableIntFieldUpdateOperationsInput | number | null
    height?: NullableIntFieldUpdateOperationsInput | number | null
    sha256?: StringFieldUpdateOperationsInput | string
    sizeBytes?: BigIntFieldUpdateOperationsInput | bigint | number
    cloudinaryFolder?: NullableStringFieldUpdateOperationsInput | string | null
    cloudinaryPublicId?: NullableStringFieldUpdateOperationsInput | string | null
    cloudinaryAssetId?: NullableStringFieldUpdateOperationsInput | string | null
    cloudinaryVersion?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
    cloudinaryFormat?: NullableStringFieldUpdateOperationsInput | string | null
    cloudinaryUrl?: NullableStringFieldUpdateOperationsInput | string | null
    duplicateOf?: NullableStringFieldUpdateOperationsInput | string | null
    uploadStatus?: StringFieldUpdateOperationsInput | string
    processingStatus?: StringFieldUpdateOperationsInput | string
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    uploadedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type MonitorScreenshotCreateManyInput = {
    id: string
    batchId?: string | null
    organizationId?: string | null
    employeeId: string
    deviceId: string
    clientScreenshotId: string
    capturedAt: Date | string
    originalFileName: string
    mimeType: string
    width?: number | null
    height?: number | null
    sha256: string
    sizeBytes?: bigint | number
    cloudinaryFolder?: string | null
    cloudinaryPublicId?: string | null
    cloudinaryAssetId?: string | null
    cloudinaryVersion?: bigint | number | null
    cloudinaryFormat?: string | null
    cloudinaryUrl?: string | null
    duplicateOf?: string | null
    uploadStatus?: string
    processingStatus?: string
    errorMessage?: string | null
    createdAt?: Date | string
    uploadedAt?: Date | string | null
  }

  export type MonitorScreenshotUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    organizationId?: NullableStringFieldUpdateOperationsInput | string | null
    employeeId?: StringFieldUpdateOperationsInput | string
    deviceId?: StringFieldUpdateOperationsInput | string
    clientScreenshotId?: StringFieldUpdateOperationsInput | string
    capturedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    originalFileName?: StringFieldUpdateOperationsInput | string
    mimeType?: StringFieldUpdateOperationsInput | string
    width?: NullableIntFieldUpdateOperationsInput | number | null
    height?: NullableIntFieldUpdateOperationsInput | number | null
    sha256?: StringFieldUpdateOperationsInput | string
    sizeBytes?: BigIntFieldUpdateOperationsInput | bigint | number
    cloudinaryFolder?: NullableStringFieldUpdateOperationsInput | string | null
    cloudinaryPublicId?: NullableStringFieldUpdateOperationsInput | string | null
    cloudinaryAssetId?: NullableStringFieldUpdateOperationsInput | string | null
    cloudinaryVersion?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
    cloudinaryFormat?: NullableStringFieldUpdateOperationsInput | string | null
    cloudinaryUrl?: NullableStringFieldUpdateOperationsInput | string | null
    duplicateOf?: NullableStringFieldUpdateOperationsInput | string | null
    uploadStatus?: StringFieldUpdateOperationsInput | string
    processingStatus?: StringFieldUpdateOperationsInput | string
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    uploadedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type MonitorScreenshotUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    batchId?: NullableStringFieldUpdateOperationsInput | string | null
    organizationId?: NullableStringFieldUpdateOperationsInput | string | null
    employeeId?: StringFieldUpdateOperationsInput | string
    deviceId?: StringFieldUpdateOperationsInput | string
    clientScreenshotId?: StringFieldUpdateOperationsInput | string
    capturedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    originalFileName?: StringFieldUpdateOperationsInput | string
    mimeType?: StringFieldUpdateOperationsInput | string
    width?: NullableIntFieldUpdateOperationsInput | number | null
    height?: NullableIntFieldUpdateOperationsInput | number | null
    sha256?: StringFieldUpdateOperationsInput | string
    sizeBytes?: BigIntFieldUpdateOperationsInput | bigint | number
    cloudinaryFolder?: NullableStringFieldUpdateOperationsInput | string | null
    cloudinaryPublicId?: NullableStringFieldUpdateOperationsInput | string | null
    cloudinaryAssetId?: NullableStringFieldUpdateOperationsInput | string | null
    cloudinaryVersion?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
    cloudinaryFormat?: NullableStringFieldUpdateOperationsInput | string | null
    cloudinaryUrl?: NullableStringFieldUpdateOperationsInput | string | null
    duplicateOf?: NullableStringFieldUpdateOperationsInput | string | null
    uploadStatus?: StringFieldUpdateOperationsInput | string
    processingStatus?: StringFieldUpdateOperationsInput | string
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    uploadedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type StringNullableListFilter<$PrismaModel = never> = {
    equals?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    has?: string | StringFieldRefInput<$PrismaModel> | null
    hasEvery?: string[] | ListStringFieldRefInput<$PrismaModel>
    hasSome?: string[] | ListStringFieldRefInput<$PrismaModel>
    isEmpty?: boolean
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type MonitorActivityEventDeviceIdIdCompoundUniqueInput = {
    deviceId: string
    id: string
  }

  export type MonitorActivityEventCountOrderByAggregateInput = {
    id?: SortOrder
    dailyKey?: SortOrder
    organizationId?: SortOrder
    employeeId?: SortOrder
    employeeName?: SortOrder
    employeeCode?: SortOrder
    deviceId?: SortOrder
    activityDate?: SortOrder
    observedAt?: SortOrder
    status?: SortOrder
    activeSeconds?: SortOrder
    idleSeconds?: SortOrder
    eventIds?: SortOrder
    createdAt?: SortOrder
  }

  export type MonitorActivityEventAvgOrderByAggregateInput = {
    activeSeconds?: SortOrder
    idleSeconds?: SortOrder
  }

  export type MonitorActivityEventMaxOrderByAggregateInput = {
    id?: SortOrder
    dailyKey?: SortOrder
    organizationId?: SortOrder
    employeeId?: SortOrder
    employeeName?: SortOrder
    employeeCode?: SortOrder
    deviceId?: SortOrder
    activityDate?: SortOrder
    observedAt?: SortOrder
    status?: SortOrder
    activeSeconds?: SortOrder
    idleSeconds?: SortOrder
    createdAt?: SortOrder
  }

  export type MonitorActivityEventMinOrderByAggregateInput = {
    id?: SortOrder
    dailyKey?: SortOrder
    organizationId?: SortOrder
    employeeId?: SortOrder
    employeeName?: SortOrder
    employeeCode?: SortOrder
    deviceId?: SortOrder
    activityDate?: SortOrder
    observedAt?: SortOrder
    status?: SortOrder
    activeSeconds?: SortOrder
    idleSeconds?: SortOrder
    createdAt?: SortOrder
  }

  export type MonitorActivityEventSumOrderByAggregateInput = {
    activeSeconds?: SortOrder
    idleSeconds?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type MonitorDevicePresenceCountOrderByAggregateInput = {
    deviceId?: SortOrder
    organizationId?: SortOrder
    employeeId?: SortOrder
    employeeName?: SortOrder
    status?: SortOrder
    lastSeenAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type MonitorDevicePresenceMaxOrderByAggregateInput = {
    deviceId?: SortOrder
    organizationId?: SortOrder
    employeeId?: SortOrder
    employeeName?: SortOrder
    status?: SortOrder
    lastSeenAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type MonitorDevicePresenceMinOrderByAggregateInput = {
    deviceId?: SortOrder
    organizationId?: SortOrder
    employeeId?: SortOrder
    employeeName?: SortOrder
    status?: SortOrder
    lastSeenAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type MonitorBrowserHistoryDeviceIdEntryIdCompoundUniqueInput = {
    deviceId: string
    entryId: string
  }

  export type MonitorBrowserHistoryCountOrderByAggregateInput = {
    entryId?: SortOrder
    organizationId?: SortOrder
    employeeId?: SortOrder
    employeeName?: SortOrder
    deviceId?: SortOrder
    observedAt?: SortOrder
    browser?: SortOrder
    url?: SortOrder
    title?: SortOrder
    activeWindowTitle?: SortOrder
    durationMs?: SortOrder
    createdAt?: SortOrder
  }

  export type MonitorBrowserHistoryAvgOrderByAggregateInput = {
    durationMs?: SortOrder
  }

  export type MonitorBrowserHistoryMaxOrderByAggregateInput = {
    entryId?: SortOrder
    organizationId?: SortOrder
    employeeId?: SortOrder
    employeeName?: SortOrder
    deviceId?: SortOrder
    observedAt?: SortOrder
    browser?: SortOrder
    url?: SortOrder
    title?: SortOrder
    activeWindowTitle?: SortOrder
    durationMs?: SortOrder
    createdAt?: SortOrder
  }

  export type MonitorBrowserHistoryMinOrderByAggregateInput = {
    entryId?: SortOrder
    organizationId?: SortOrder
    employeeId?: SortOrder
    employeeName?: SortOrder
    deviceId?: SortOrder
    observedAt?: SortOrder
    browser?: SortOrder
    url?: SortOrder
    title?: SortOrder
    activeWindowTitle?: SortOrder
    durationMs?: SortOrder
    createdAt?: SortOrder
  }

  export type MonitorBrowserHistorySumOrderByAggregateInput = {
    durationMs?: SortOrder
  }
  export type JsonFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonFilterBase<$PrismaModel>>, 'path'>>

  export type JsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type MonitorAppUsageSessionDeviceIdSessionIdCompoundUniqueInput = {
    deviceId: string
    sessionId: string
  }

  export type MonitorAppUsageSessionCountOrderByAggregateInput = {
    sessionId?: SortOrder
    organizationId?: SortOrder
    employeeId?: SortOrder
    employeeName?: SortOrder
    employeeCode?: SortOrder
    deviceId?: SortOrder
    observedAt?: SortOrder
    appName?: SortOrder
    processName?: SortOrder
    startedAt?: SortOrder
    endedAt?: SortOrder
    activeSeconds?: SortOrder
    keyPressCount?: SortOrder
    keyNames?: SortOrder
    typedText?: SortOrder
    keyStreamText?: SortOrder
    uploadStatus?: SortOrder
    retryCount?: SortOrder
    lastError?: SortOrder
    createdAt?: SortOrder
    uploadedAt?: SortOrder
  }

  export type MonitorAppUsageSessionAvgOrderByAggregateInput = {
    activeSeconds?: SortOrder
    keyPressCount?: SortOrder
    retryCount?: SortOrder
  }

  export type MonitorAppUsageSessionMaxOrderByAggregateInput = {
    sessionId?: SortOrder
    organizationId?: SortOrder
    employeeId?: SortOrder
    employeeName?: SortOrder
    employeeCode?: SortOrder
    deviceId?: SortOrder
    observedAt?: SortOrder
    appName?: SortOrder
    processName?: SortOrder
    startedAt?: SortOrder
    endedAt?: SortOrder
    activeSeconds?: SortOrder
    keyPressCount?: SortOrder
    typedText?: SortOrder
    keyStreamText?: SortOrder
    uploadStatus?: SortOrder
    retryCount?: SortOrder
    lastError?: SortOrder
    createdAt?: SortOrder
    uploadedAt?: SortOrder
  }

  export type MonitorAppUsageSessionMinOrderByAggregateInput = {
    sessionId?: SortOrder
    organizationId?: SortOrder
    employeeId?: SortOrder
    employeeName?: SortOrder
    employeeCode?: SortOrder
    deviceId?: SortOrder
    observedAt?: SortOrder
    appName?: SortOrder
    processName?: SortOrder
    startedAt?: SortOrder
    endedAt?: SortOrder
    activeSeconds?: SortOrder
    keyPressCount?: SortOrder
    typedText?: SortOrder
    keyStreamText?: SortOrder
    uploadStatus?: SortOrder
    retryCount?: SortOrder
    lastError?: SortOrder
    createdAt?: SortOrder
    uploadedAt?: SortOrder
  }

  export type MonitorAppUsageSessionSumOrderByAggregateInput = {
    activeSeconds?: SortOrder
    keyPressCount?: SortOrder
    retryCount?: SortOrder
  }
  export type JsonWithAggregatesFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedJsonFilter<$PrismaModel>
    _max?: NestedJsonFilter<$PrismaModel>
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type MonitorCloudinarySettingCountOrderByAggregateInput = {
    organizationId?: SortOrder
    cloudName?: SortOrder
    apiKey?: SortOrder
    apiSecretCiphertext?: SortOrder
    apiSecretIv?: SortOrder
    apiSecretAuthTag?: SortOrder
    uploadFolderRoot?: SortOrder
    screenshotsEnabled?: SortOrder
    mouseEnabled?: SortOrder
    keyboardEnabled?: SortOrder
    appUsageEnabled?: SortOrder
    browserHistoryEnabled?: SortOrder
    usbEnabled?: SortOrder
    screenshotIntervalMinutes?: SortOrder
    mouseHeartbeatMinutes?: SortOrder
    mouseIdleThresholdMinutes?: SortOrder
    keyboardHeartbeatMinutes?: SortOrder
    appUsageHeartbeatMinutes?: SortOrder
    browserHistorySyncMinutes?: SortOrder
    updatedAt?: SortOrder
  }

  export type MonitorCloudinarySettingAvgOrderByAggregateInput = {
    screenshotIntervalMinutes?: SortOrder
    mouseHeartbeatMinutes?: SortOrder
    mouseIdleThresholdMinutes?: SortOrder
    keyboardHeartbeatMinutes?: SortOrder
    appUsageHeartbeatMinutes?: SortOrder
    browserHistorySyncMinutes?: SortOrder
  }

  export type MonitorCloudinarySettingMaxOrderByAggregateInput = {
    organizationId?: SortOrder
    cloudName?: SortOrder
    apiKey?: SortOrder
    apiSecretCiphertext?: SortOrder
    apiSecretIv?: SortOrder
    apiSecretAuthTag?: SortOrder
    uploadFolderRoot?: SortOrder
    screenshotsEnabled?: SortOrder
    mouseEnabled?: SortOrder
    keyboardEnabled?: SortOrder
    appUsageEnabled?: SortOrder
    browserHistoryEnabled?: SortOrder
    usbEnabled?: SortOrder
    screenshotIntervalMinutes?: SortOrder
    mouseHeartbeatMinutes?: SortOrder
    mouseIdleThresholdMinutes?: SortOrder
    keyboardHeartbeatMinutes?: SortOrder
    appUsageHeartbeatMinutes?: SortOrder
    browserHistorySyncMinutes?: SortOrder
    updatedAt?: SortOrder
  }

  export type MonitorCloudinarySettingMinOrderByAggregateInput = {
    organizationId?: SortOrder
    cloudName?: SortOrder
    apiKey?: SortOrder
    apiSecretCiphertext?: SortOrder
    apiSecretIv?: SortOrder
    apiSecretAuthTag?: SortOrder
    uploadFolderRoot?: SortOrder
    screenshotsEnabled?: SortOrder
    mouseEnabled?: SortOrder
    keyboardEnabled?: SortOrder
    appUsageEnabled?: SortOrder
    browserHistoryEnabled?: SortOrder
    usbEnabled?: SortOrder
    screenshotIntervalMinutes?: SortOrder
    mouseHeartbeatMinutes?: SortOrder
    mouseIdleThresholdMinutes?: SortOrder
    keyboardHeartbeatMinutes?: SortOrder
    appUsageHeartbeatMinutes?: SortOrder
    browserHistorySyncMinutes?: SortOrder
    updatedAt?: SortOrder
  }

  export type MonitorCloudinarySettingSumOrderByAggregateInput = {
    screenshotIntervalMinutes?: SortOrder
    mouseHeartbeatMinutes?: SortOrder
    mouseIdleThresholdMinutes?: SortOrder
    keyboardHeartbeatMinutes?: SortOrder
    appUsageHeartbeatMinutes?: SortOrder
    browserHistorySyncMinutes?: SortOrder
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type BigIntFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntFilter<$PrismaModel> | bigint | number
  }

  export type IntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type DecimalNullableFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel> | null
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalNullableFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string | null
  }

  export type BigIntNullableFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel> | null
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel> | null
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel> | null
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntNullableFilter<$PrismaModel> | bigint | number | null
  }

  export type BoolNullableFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel> | null
    not?: NestedBoolNullableFilter<$PrismaModel> | boolean | null
  }

  export type MonitorDeviceHealthOrganizationIdDeviceIdCompoundUniqueInput = {
    organizationId: string
    deviceId: string
  }

  export type MonitorDeviceHealthCountOrderByAggregateInput = {
    id?: SortOrder
    organizationId?: SortOrder
    employeeId?: SortOrder
    employeeName?: SortOrder
    employeeCode?: SortOrder
    deviceId?: SortOrder
    hostname?: SortOrder
    platform?: SortOrder
    platformVersion?: SortOrder
    agentVersion?: SortOrder
    cpuModel?: SortOrder
    cpuCoreCount?: SortOrder
    cpuPercent?: SortOrder
    memoryTotalBytes?: SortOrder
    memoryUsedBytes?: SortOrder
    memoryPercent?: SortOrder
    disks?: SortOrder
    temperatureC?: SortOrder
    batteryPercent?: SortOrder
    batteryCharging?: SortOrder
    uptimeSeconds?: SortOrder
    lastSeenAt?: SortOrder
    reportedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type MonitorDeviceHealthAvgOrderByAggregateInput = {
    id?: SortOrder
    cpuCoreCount?: SortOrder
    cpuPercent?: SortOrder
    memoryTotalBytes?: SortOrder
    memoryUsedBytes?: SortOrder
    memoryPercent?: SortOrder
    temperatureC?: SortOrder
    batteryPercent?: SortOrder
    uptimeSeconds?: SortOrder
  }

  export type MonitorDeviceHealthMaxOrderByAggregateInput = {
    id?: SortOrder
    organizationId?: SortOrder
    employeeId?: SortOrder
    employeeName?: SortOrder
    employeeCode?: SortOrder
    deviceId?: SortOrder
    hostname?: SortOrder
    platform?: SortOrder
    platformVersion?: SortOrder
    agentVersion?: SortOrder
    cpuModel?: SortOrder
    cpuCoreCount?: SortOrder
    cpuPercent?: SortOrder
    memoryTotalBytes?: SortOrder
    memoryUsedBytes?: SortOrder
    memoryPercent?: SortOrder
    temperatureC?: SortOrder
    batteryPercent?: SortOrder
    batteryCharging?: SortOrder
    uptimeSeconds?: SortOrder
    lastSeenAt?: SortOrder
    reportedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type MonitorDeviceHealthMinOrderByAggregateInput = {
    id?: SortOrder
    organizationId?: SortOrder
    employeeId?: SortOrder
    employeeName?: SortOrder
    employeeCode?: SortOrder
    deviceId?: SortOrder
    hostname?: SortOrder
    platform?: SortOrder
    platformVersion?: SortOrder
    agentVersion?: SortOrder
    cpuModel?: SortOrder
    cpuCoreCount?: SortOrder
    cpuPercent?: SortOrder
    memoryTotalBytes?: SortOrder
    memoryUsedBytes?: SortOrder
    memoryPercent?: SortOrder
    temperatureC?: SortOrder
    batteryPercent?: SortOrder
    batteryCharging?: SortOrder
    uptimeSeconds?: SortOrder
    lastSeenAt?: SortOrder
    reportedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type MonitorDeviceHealthSumOrderByAggregateInput = {
    id?: SortOrder
    cpuCoreCount?: SortOrder
    cpuPercent?: SortOrder
    memoryTotalBytes?: SortOrder
    memoryUsedBytes?: SortOrder
    memoryPercent?: SortOrder
    temperatureC?: SortOrder
    batteryPercent?: SortOrder
    uptimeSeconds?: SortOrder
  }

  export type BigIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntWithAggregatesFilter<$PrismaModel> | bigint | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedBigIntFilter<$PrismaModel>
    _min?: NestedBigIntFilter<$PrismaModel>
    _max?: NestedBigIntFilter<$PrismaModel>
  }

  export type IntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type DecimalNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel> | null
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalNullableWithAggregatesFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedDecimalNullableFilter<$PrismaModel>
    _sum?: NestedDecimalNullableFilter<$PrismaModel>
    _min?: NestedDecimalNullableFilter<$PrismaModel>
    _max?: NestedDecimalNullableFilter<$PrismaModel>
  }

  export type BigIntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel> | null
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel> | null
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel> | null
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntNullableWithAggregatesFilter<$PrismaModel> | bigint | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedBigIntNullableFilter<$PrismaModel>
    _min?: NestedBigIntNullableFilter<$PrismaModel>
    _max?: NestedBigIntNullableFilter<$PrismaModel>
  }

  export type BoolNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel> | null
    not?: NestedBoolNullableWithAggregatesFilter<$PrismaModel> | boolean | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedBoolNullableFilter<$PrismaModel>
    _max?: NestedBoolNullableFilter<$PrismaModel>
  }

  export type MonitorScreenshotListRelationFilter = {
    every?: MonitorScreenshotWhereInput
    some?: MonitorScreenshotWhereInput
    none?: MonitorScreenshotWhereInput
  }

  export type MonitorScreenshotOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type MonitorScreenshotBatchDeviceIdIdCompoundUniqueInput = {
    deviceId: string
    id: string
  }

  export type MonitorScreenshotBatchCountOrderByAggregateInput = {
    id?: SortOrder
    organizationId?: SortOrder
    employeeId?: SortOrder
    deviceId?: SortOrder
    status?: SortOrder
    expectedCount?: SortOrder
    uploadedCount?: SortOrder
    duplicateCount?: SortOrder
    expectedBytes?: SortOrder
    uploadedBytes?: SortOrder
    firstCapturedAt?: SortOrder
    lastCapturedAt?: SortOrder
    createdAt?: SortOrder
    completedAt?: SortOrder
  }

  export type MonitorScreenshotBatchAvgOrderByAggregateInput = {
    expectedCount?: SortOrder
    uploadedCount?: SortOrder
    duplicateCount?: SortOrder
    expectedBytes?: SortOrder
    uploadedBytes?: SortOrder
  }

  export type MonitorScreenshotBatchMaxOrderByAggregateInput = {
    id?: SortOrder
    organizationId?: SortOrder
    employeeId?: SortOrder
    deviceId?: SortOrder
    status?: SortOrder
    expectedCount?: SortOrder
    uploadedCount?: SortOrder
    duplicateCount?: SortOrder
    expectedBytes?: SortOrder
    uploadedBytes?: SortOrder
    firstCapturedAt?: SortOrder
    lastCapturedAt?: SortOrder
    createdAt?: SortOrder
    completedAt?: SortOrder
  }

  export type MonitorScreenshotBatchMinOrderByAggregateInput = {
    id?: SortOrder
    organizationId?: SortOrder
    employeeId?: SortOrder
    deviceId?: SortOrder
    status?: SortOrder
    expectedCount?: SortOrder
    uploadedCount?: SortOrder
    duplicateCount?: SortOrder
    expectedBytes?: SortOrder
    uploadedBytes?: SortOrder
    firstCapturedAt?: SortOrder
    lastCapturedAt?: SortOrder
    createdAt?: SortOrder
    completedAt?: SortOrder
  }

  export type MonitorScreenshotBatchSumOrderByAggregateInput = {
    expectedCount?: SortOrder
    uploadedCount?: SortOrder
    duplicateCount?: SortOrder
    expectedBytes?: SortOrder
    uploadedBytes?: SortOrder
  }

  export type MonitorScreenshotBatchNullableScalarRelationFilter = {
    is?: MonitorScreenshotBatchWhereInput | null
    isNot?: MonitorScreenshotBatchWhereInput | null
  }

  export type MonitorScreenshotDeviceIdClientScreenshotIdCompoundUniqueInput = {
    deviceId: string
    clientScreenshotId: string
  }

  export type MonitorScreenshotCountOrderByAggregateInput = {
    id?: SortOrder
    batchId?: SortOrder
    organizationId?: SortOrder
    employeeId?: SortOrder
    deviceId?: SortOrder
    clientScreenshotId?: SortOrder
    capturedAt?: SortOrder
    originalFileName?: SortOrder
    mimeType?: SortOrder
    width?: SortOrder
    height?: SortOrder
    sha256?: SortOrder
    sizeBytes?: SortOrder
    cloudinaryFolder?: SortOrder
    cloudinaryPublicId?: SortOrder
    cloudinaryAssetId?: SortOrder
    cloudinaryVersion?: SortOrder
    cloudinaryFormat?: SortOrder
    cloudinaryUrl?: SortOrder
    duplicateOf?: SortOrder
    uploadStatus?: SortOrder
    processingStatus?: SortOrder
    errorMessage?: SortOrder
    createdAt?: SortOrder
    uploadedAt?: SortOrder
  }

  export type MonitorScreenshotAvgOrderByAggregateInput = {
    width?: SortOrder
    height?: SortOrder
    sizeBytes?: SortOrder
    cloudinaryVersion?: SortOrder
  }

  export type MonitorScreenshotMaxOrderByAggregateInput = {
    id?: SortOrder
    batchId?: SortOrder
    organizationId?: SortOrder
    employeeId?: SortOrder
    deviceId?: SortOrder
    clientScreenshotId?: SortOrder
    capturedAt?: SortOrder
    originalFileName?: SortOrder
    mimeType?: SortOrder
    width?: SortOrder
    height?: SortOrder
    sha256?: SortOrder
    sizeBytes?: SortOrder
    cloudinaryFolder?: SortOrder
    cloudinaryPublicId?: SortOrder
    cloudinaryAssetId?: SortOrder
    cloudinaryVersion?: SortOrder
    cloudinaryFormat?: SortOrder
    cloudinaryUrl?: SortOrder
    duplicateOf?: SortOrder
    uploadStatus?: SortOrder
    processingStatus?: SortOrder
    errorMessage?: SortOrder
    createdAt?: SortOrder
    uploadedAt?: SortOrder
  }

  export type MonitorScreenshotMinOrderByAggregateInput = {
    id?: SortOrder
    batchId?: SortOrder
    organizationId?: SortOrder
    employeeId?: SortOrder
    deviceId?: SortOrder
    clientScreenshotId?: SortOrder
    capturedAt?: SortOrder
    originalFileName?: SortOrder
    mimeType?: SortOrder
    width?: SortOrder
    height?: SortOrder
    sha256?: SortOrder
    sizeBytes?: SortOrder
    cloudinaryFolder?: SortOrder
    cloudinaryPublicId?: SortOrder
    cloudinaryAssetId?: SortOrder
    cloudinaryVersion?: SortOrder
    cloudinaryFormat?: SortOrder
    cloudinaryUrl?: SortOrder
    duplicateOf?: SortOrder
    uploadStatus?: SortOrder
    processingStatus?: SortOrder
    errorMessage?: SortOrder
    createdAt?: SortOrder
    uploadedAt?: SortOrder
  }

  export type MonitorScreenshotSumOrderByAggregateInput = {
    width?: SortOrder
    height?: SortOrder
    sizeBytes?: SortOrder
    cloudinaryVersion?: SortOrder
  }

  export type MonitorActivityEventCreateeventIdsInput = {
    set: string[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type MonitorActivityEventUpdateeventIdsInput = {
    set?: string[]
    push?: string | string[]
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type BigIntFieldUpdateOperationsInput = {
    set?: bigint | number
    increment?: bigint | number
    decrement?: bigint | number
    multiply?: bigint | number
    divide?: bigint | number
  }

  export type NullableIntFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type NullableDecimalFieldUpdateOperationsInput = {
    set?: Decimal | DecimalJsLike | number | string | null
    increment?: Decimal | DecimalJsLike | number | string
    decrement?: Decimal | DecimalJsLike | number | string
    multiply?: Decimal | DecimalJsLike | number | string
    divide?: Decimal | DecimalJsLike | number | string
  }

  export type NullableBigIntFieldUpdateOperationsInput = {
    set?: bigint | number | null
    increment?: bigint | number
    decrement?: bigint | number
    multiply?: bigint | number
    divide?: bigint | number
  }

  export type NullableBoolFieldUpdateOperationsInput = {
    set?: boolean | null
  }

  export type MonitorScreenshotCreateNestedManyWithoutBatchInput = {
    create?: XOR<MonitorScreenshotCreateWithoutBatchInput, MonitorScreenshotUncheckedCreateWithoutBatchInput> | MonitorScreenshotCreateWithoutBatchInput[] | MonitorScreenshotUncheckedCreateWithoutBatchInput[]
    connectOrCreate?: MonitorScreenshotCreateOrConnectWithoutBatchInput | MonitorScreenshotCreateOrConnectWithoutBatchInput[]
    createMany?: MonitorScreenshotCreateManyBatchInputEnvelope
    connect?: MonitorScreenshotWhereUniqueInput | MonitorScreenshotWhereUniqueInput[]
  }

  export type MonitorScreenshotUncheckedCreateNestedManyWithoutBatchInput = {
    create?: XOR<MonitorScreenshotCreateWithoutBatchInput, MonitorScreenshotUncheckedCreateWithoutBatchInput> | MonitorScreenshotCreateWithoutBatchInput[] | MonitorScreenshotUncheckedCreateWithoutBatchInput[]
    connectOrCreate?: MonitorScreenshotCreateOrConnectWithoutBatchInput | MonitorScreenshotCreateOrConnectWithoutBatchInput[]
    createMany?: MonitorScreenshotCreateManyBatchInputEnvelope
    connect?: MonitorScreenshotWhereUniqueInput | MonitorScreenshotWhereUniqueInput[]
  }

  export type MonitorScreenshotUpdateManyWithoutBatchNestedInput = {
    create?: XOR<MonitorScreenshotCreateWithoutBatchInput, MonitorScreenshotUncheckedCreateWithoutBatchInput> | MonitorScreenshotCreateWithoutBatchInput[] | MonitorScreenshotUncheckedCreateWithoutBatchInput[]
    connectOrCreate?: MonitorScreenshotCreateOrConnectWithoutBatchInput | MonitorScreenshotCreateOrConnectWithoutBatchInput[]
    upsert?: MonitorScreenshotUpsertWithWhereUniqueWithoutBatchInput | MonitorScreenshotUpsertWithWhereUniqueWithoutBatchInput[]
    createMany?: MonitorScreenshotCreateManyBatchInputEnvelope
    set?: MonitorScreenshotWhereUniqueInput | MonitorScreenshotWhereUniqueInput[]
    disconnect?: MonitorScreenshotWhereUniqueInput | MonitorScreenshotWhereUniqueInput[]
    delete?: MonitorScreenshotWhereUniqueInput | MonitorScreenshotWhereUniqueInput[]
    connect?: MonitorScreenshotWhereUniqueInput | MonitorScreenshotWhereUniqueInput[]
    update?: MonitorScreenshotUpdateWithWhereUniqueWithoutBatchInput | MonitorScreenshotUpdateWithWhereUniqueWithoutBatchInput[]
    updateMany?: MonitorScreenshotUpdateManyWithWhereWithoutBatchInput | MonitorScreenshotUpdateManyWithWhereWithoutBatchInput[]
    deleteMany?: MonitorScreenshotScalarWhereInput | MonitorScreenshotScalarWhereInput[]
  }

  export type MonitorScreenshotUncheckedUpdateManyWithoutBatchNestedInput = {
    create?: XOR<MonitorScreenshotCreateWithoutBatchInput, MonitorScreenshotUncheckedCreateWithoutBatchInput> | MonitorScreenshotCreateWithoutBatchInput[] | MonitorScreenshotUncheckedCreateWithoutBatchInput[]
    connectOrCreate?: MonitorScreenshotCreateOrConnectWithoutBatchInput | MonitorScreenshotCreateOrConnectWithoutBatchInput[]
    upsert?: MonitorScreenshotUpsertWithWhereUniqueWithoutBatchInput | MonitorScreenshotUpsertWithWhereUniqueWithoutBatchInput[]
    createMany?: MonitorScreenshotCreateManyBatchInputEnvelope
    set?: MonitorScreenshotWhereUniqueInput | MonitorScreenshotWhereUniqueInput[]
    disconnect?: MonitorScreenshotWhereUniqueInput | MonitorScreenshotWhereUniqueInput[]
    delete?: MonitorScreenshotWhereUniqueInput | MonitorScreenshotWhereUniqueInput[]
    connect?: MonitorScreenshotWhereUniqueInput | MonitorScreenshotWhereUniqueInput[]
    update?: MonitorScreenshotUpdateWithWhereUniqueWithoutBatchInput | MonitorScreenshotUpdateWithWhereUniqueWithoutBatchInput[]
    updateMany?: MonitorScreenshotUpdateManyWithWhereWithoutBatchInput | MonitorScreenshotUpdateManyWithWhereWithoutBatchInput[]
    deleteMany?: MonitorScreenshotScalarWhereInput | MonitorScreenshotScalarWhereInput[]
  }

  export type MonitorScreenshotBatchCreateNestedOneWithoutScreenshotsInput = {
    create?: XOR<MonitorScreenshotBatchCreateWithoutScreenshotsInput, MonitorScreenshotBatchUncheckedCreateWithoutScreenshotsInput>
    connectOrCreate?: MonitorScreenshotBatchCreateOrConnectWithoutScreenshotsInput
    connect?: MonitorScreenshotBatchWhereUniqueInput
  }

  export type MonitorScreenshotBatchUpdateOneWithoutScreenshotsNestedInput = {
    create?: XOR<MonitorScreenshotBatchCreateWithoutScreenshotsInput, MonitorScreenshotBatchUncheckedCreateWithoutScreenshotsInput>
    connectOrCreate?: MonitorScreenshotBatchCreateOrConnectWithoutScreenshotsInput
    upsert?: MonitorScreenshotBatchUpsertWithoutScreenshotsInput
    disconnect?: MonitorScreenshotBatchWhereInput | boolean
    delete?: MonitorScreenshotBatchWhereInput | boolean
    connect?: MonitorScreenshotBatchWhereUniqueInput
    update?: XOR<XOR<MonitorScreenshotBatchUpdateToOneWithWhereWithoutScreenshotsInput, MonitorScreenshotBatchUpdateWithoutScreenshotsInput>, MonitorScreenshotBatchUncheckedUpdateWithoutScreenshotsInput>
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }
  export type NestedJsonFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<NestedJsonFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type NestedBigIntFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntFilter<$PrismaModel> | bigint | number
  }

  export type NestedDecimalNullableFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel> | null
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalNullableFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string | null
  }

  export type NestedBigIntNullableFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel> | null
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel> | null
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel> | null
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntNullableFilter<$PrismaModel> | bigint | number | null
  }

  export type NestedBoolNullableFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel> | null
    not?: NestedBoolNullableFilter<$PrismaModel> | boolean | null
  }

  export type NestedBigIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntWithAggregatesFilter<$PrismaModel> | bigint | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedBigIntFilter<$PrismaModel>
    _min?: NestedBigIntFilter<$PrismaModel>
    _max?: NestedBigIntFilter<$PrismaModel>
  }

  export type NestedIntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type NestedFloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type NestedDecimalNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel> | null
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalNullableWithAggregatesFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedDecimalNullableFilter<$PrismaModel>
    _sum?: NestedDecimalNullableFilter<$PrismaModel>
    _min?: NestedDecimalNullableFilter<$PrismaModel>
    _max?: NestedDecimalNullableFilter<$PrismaModel>
  }

  export type NestedBigIntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel> | null
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel> | null
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel> | null
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntNullableWithAggregatesFilter<$PrismaModel> | bigint | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedBigIntNullableFilter<$PrismaModel>
    _min?: NestedBigIntNullableFilter<$PrismaModel>
    _max?: NestedBigIntNullableFilter<$PrismaModel>
  }

  export type NestedBoolNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel> | null
    not?: NestedBoolNullableWithAggregatesFilter<$PrismaModel> | boolean | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedBoolNullableFilter<$PrismaModel>
    _max?: NestedBoolNullableFilter<$PrismaModel>
  }

  export type MonitorScreenshotCreateWithoutBatchInput = {
    id: string
    organizationId?: string | null
    employeeId: string
    deviceId: string
    clientScreenshotId: string
    capturedAt: Date | string
    originalFileName: string
    mimeType: string
    width?: number | null
    height?: number | null
    sha256: string
    sizeBytes?: bigint | number
    cloudinaryFolder?: string | null
    cloudinaryPublicId?: string | null
    cloudinaryAssetId?: string | null
    cloudinaryVersion?: bigint | number | null
    cloudinaryFormat?: string | null
    cloudinaryUrl?: string | null
    duplicateOf?: string | null
    uploadStatus?: string
    processingStatus?: string
    errorMessage?: string | null
    createdAt?: Date | string
    uploadedAt?: Date | string | null
  }

  export type MonitorScreenshotUncheckedCreateWithoutBatchInput = {
    id: string
    organizationId?: string | null
    employeeId: string
    deviceId: string
    clientScreenshotId: string
    capturedAt: Date | string
    originalFileName: string
    mimeType: string
    width?: number | null
    height?: number | null
    sha256: string
    sizeBytes?: bigint | number
    cloudinaryFolder?: string | null
    cloudinaryPublicId?: string | null
    cloudinaryAssetId?: string | null
    cloudinaryVersion?: bigint | number | null
    cloudinaryFormat?: string | null
    cloudinaryUrl?: string | null
    duplicateOf?: string | null
    uploadStatus?: string
    processingStatus?: string
    errorMessage?: string | null
    createdAt?: Date | string
    uploadedAt?: Date | string | null
  }

  export type MonitorScreenshotCreateOrConnectWithoutBatchInput = {
    where: MonitorScreenshotWhereUniqueInput
    create: XOR<MonitorScreenshotCreateWithoutBatchInput, MonitorScreenshotUncheckedCreateWithoutBatchInput>
  }

  export type MonitorScreenshotCreateManyBatchInputEnvelope = {
    data: MonitorScreenshotCreateManyBatchInput | MonitorScreenshotCreateManyBatchInput[]
    skipDuplicates?: boolean
  }

  export type MonitorScreenshotUpsertWithWhereUniqueWithoutBatchInput = {
    where: MonitorScreenshotWhereUniqueInput
    update: XOR<MonitorScreenshotUpdateWithoutBatchInput, MonitorScreenshotUncheckedUpdateWithoutBatchInput>
    create: XOR<MonitorScreenshotCreateWithoutBatchInput, MonitorScreenshotUncheckedCreateWithoutBatchInput>
  }

  export type MonitorScreenshotUpdateWithWhereUniqueWithoutBatchInput = {
    where: MonitorScreenshotWhereUniqueInput
    data: XOR<MonitorScreenshotUpdateWithoutBatchInput, MonitorScreenshotUncheckedUpdateWithoutBatchInput>
  }

  export type MonitorScreenshotUpdateManyWithWhereWithoutBatchInput = {
    where: MonitorScreenshotScalarWhereInput
    data: XOR<MonitorScreenshotUpdateManyMutationInput, MonitorScreenshotUncheckedUpdateManyWithoutBatchInput>
  }

  export type MonitorScreenshotScalarWhereInput = {
    AND?: MonitorScreenshotScalarWhereInput | MonitorScreenshotScalarWhereInput[]
    OR?: MonitorScreenshotScalarWhereInput[]
    NOT?: MonitorScreenshotScalarWhereInput | MonitorScreenshotScalarWhereInput[]
    id?: StringFilter<"MonitorScreenshot"> | string
    batchId?: StringNullableFilter<"MonitorScreenshot"> | string | null
    organizationId?: StringNullableFilter<"MonitorScreenshot"> | string | null
    employeeId?: StringFilter<"MonitorScreenshot"> | string
    deviceId?: StringFilter<"MonitorScreenshot"> | string
    clientScreenshotId?: StringFilter<"MonitorScreenshot"> | string
    capturedAt?: DateTimeFilter<"MonitorScreenshot"> | Date | string
    originalFileName?: StringFilter<"MonitorScreenshot"> | string
    mimeType?: StringFilter<"MonitorScreenshot"> | string
    width?: IntNullableFilter<"MonitorScreenshot"> | number | null
    height?: IntNullableFilter<"MonitorScreenshot"> | number | null
    sha256?: StringFilter<"MonitorScreenshot"> | string
    sizeBytes?: BigIntFilter<"MonitorScreenshot"> | bigint | number
    cloudinaryFolder?: StringNullableFilter<"MonitorScreenshot"> | string | null
    cloudinaryPublicId?: StringNullableFilter<"MonitorScreenshot"> | string | null
    cloudinaryAssetId?: StringNullableFilter<"MonitorScreenshot"> | string | null
    cloudinaryVersion?: BigIntNullableFilter<"MonitorScreenshot"> | bigint | number | null
    cloudinaryFormat?: StringNullableFilter<"MonitorScreenshot"> | string | null
    cloudinaryUrl?: StringNullableFilter<"MonitorScreenshot"> | string | null
    duplicateOf?: StringNullableFilter<"MonitorScreenshot"> | string | null
    uploadStatus?: StringFilter<"MonitorScreenshot"> | string
    processingStatus?: StringFilter<"MonitorScreenshot"> | string
    errorMessage?: StringNullableFilter<"MonitorScreenshot"> | string | null
    createdAt?: DateTimeFilter<"MonitorScreenshot"> | Date | string
    uploadedAt?: DateTimeNullableFilter<"MonitorScreenshot"> | Date | string | null
  }

  export type MonitorScreenshotBatchCreateWithoutScreenshotsInput = {
    id: string
    organizationId?: string | null
    employeeId: string
    deviceId: string
    status?: string
    expectedCount?: number
    uploadedCount?: number
    duplicateCount?: number
    expectedBytes?: bigint | number
    uploadedBytes?: bigint | number
    firstCapturedAt?: Date | string | null
    lastCapturedAt?: Date | string | null
    createdAt?: Date | string
    completedAt?: Date | string | null
  }

  export type MonitorScreenshotBatchUncheckedCreateWithoutScreenshotsInput = {
    id: string
    organizationId?: string | null
    employeeId: string
    deviceId: string
    status?: string
    expectedCount?: number
    uploadedCount?: number
    duplicateCount?: number
    expectedBytes?: bigint | number
    uploadedBytes?: bigint | number
    firstCapturedAt?: Date | string | null
    lastCapturedAt?: Date | string | null
    createdAt?: Date | string
    completedAt?: Date | string | null
  }

  export type MonitorScreenshotBatchCreateOrConnectWithoutScreenshotsInput = {
    where: MonitorScreenshotBatchWhereUniqueInput
    create: XOR<MonitorScreenshotBatchCreateWithoutScreenshotsInput, MonitorScreenshotBatchUncheckedCreateWithoutScreenshotsInput>
  }

  export type MonitorScreenshotBatchUpsertWithoutScreenshotsInput = {
    update: XOR<MonitorScreenshotBatchUpdateWithoutScreenshotsInput, MonitorScreenshotBatchUncheckedUpdateWithoutScreenshotsInput>
    create: XOR<MonitorScreenshotBatchCreateWithoutScreenshotsInput, MonitorScreenshotBatchUncheckedCreateWithoutScreenshotsInput>
    where?: MonitorScreenshotBatchWhereInput
  }

  export type MonitorScreenshotBatchUpdateToOneWithWhereWithoutScreenshotsInput = {
    where?: MonitorScreenshotBatchWhereInput
    data: XOR<MonitorScreenshotBatchUpdateWithoutScreenshotsInput, MonitorScreenshotBatchUncheckedUpdateWithoutScreenshotsInput>
  }

  export type MonitorScreenshotBatchUpdateWithoutScreenshotsInput = {
    id?: StringFieldUpdateOperationsInput | string
    organizationId?: NullableStringFieldUpdateOperationsInput | string | null
    employeeId?: StringFieldUpdateOperationsInput | string
    deviceId?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    expectedCount?: IntFieldUpdateOperationsInput | number
    uploadedCount?: IntFieldUpdateOperationsInput | number
    duplicateCount?: IntFieldUpdateOperationsInput | number
    expectedBytes?: BigIntFieldUpdateOperationsInput | bigint | number
    uploadedBytes?: BigIntFieldUpdateOperationsInput | bigint | number
    firstCapturedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastCapturedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type MonitorScreenshotBatchUncheckedUpdateWithoutScreenshotsInput = {
    id?: StringFieldUpdateOperationsInput | string
    organizationId?: NullableStringFieldUpdateOperationsInput | string | null
    employeeId?: StringFieldUpdateOperationsInput | string
    deviceId?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    expectedCount?: IntFieldUpdateOperationsInput | number
    uploadedCount?: IntFieldUpdateOperationsInput | number
    duplicateCount?: IntFieldUpdateOperationsInput | number
    expectedBytes?: BigIntFieldUpdateOperationsInput | bigint | number
    uploadedBytes?: BigIntFieldUpdateOperationsInput | bigint | number
    firstCapturedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastCapturedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type MonitorScreenshotCreateManyBatchInput = {
    id: string
    organizationId?: string | null
    employeeId: string
    deviceId: string
    clientScreenshotId: string
    capturedAt: Date | string
    originalFileName: string
    mimeType: string
    width?: number | null
    height?: number | null
    sha256: string
    sizeBytes?: bigint | number
    cloudinaryFolder?: string | null
    cloudinaryPublicId?: string | null
    cloudinaryAssetId?: string | null
    cloudinaryVersion?: bigint | number | null
    cloudinaryFormat?: string | null
    cloudinaryUrl?: string | null
    duplicateOf?: string | null
    uploadStatus?: string
    processingStatus?: string
    errorMessage?: string | null
    createdAt?: Date | string
    uploadedAt?: Date | string | null
  }

  export type MonitorScreenshotUpdateWithoutBatchInput = {
    id?: StringFieldUpdateOperationsInput | string
    organizationId?: NullableStringFieldUpdateOperationsInput | string | null
    employeeId?: StringFieldUpdateOperationsInput | string
    deviceId?: StringFieldUpdateOperationsInput | string
    clientScreenshotId?: StringFieldUpdateOperationsInput | string
    capturedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    originalFileName?: StringFieldUpdateOperationsInput | string
    mimeType?: StringFieldUpdateOperationsInput | string
    width?: NullableIntFieldUpdateOperationsInput | number | null
    height?: NullableIntFieldUpdateOperationsInput | number | null
    sha256?: StringFieldUpdateOperationsInput | string
    sizeBytes?: BigIntFieldUpdateOperationsInput | bigint | number
    cloudinaryFolder?: NullableStringFieldUpdateOperationsInput | string | null
    cloudinaryPublicId?: NullableStringFieldUpdateOperationsInput | string | null
    cloudinaryAssetId?: NullableStringFieldUpdateOperationsInput | string | null
    cloudinaryVersion?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
    cloudinaryFormat?: NullableStringFieldUpdateOperationsInput | string | null
    cloudinaryUrl?: NullableStringFieldUpdateOperationsInput | string | null
    duplicateOf?: NullableStringFieldUpdateOperationsInput | string | null
    uploadStatus?: StringFieldUpdateOperationsInput | string
    processingStatus?: StringFieldUpdateOperationsInput | string
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    uploadedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type MonitorScreenshotUncheckedUpdateWithoutBatchInput = {
    id?: StringFieldUpdateOperationsInput | string
    organizationId?: NullableStringFieldUpdateOperationsInput | string | null
    employeeId?: StringFieldUpdateOperationsInput | string
    deviceId?: StringFieldUpdateOperationsInput | string
    clientScreenshotId?: StringFieldUpdateOperationsInput | string
    capturedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    originalFileName?: StringFieldUpdateOperationsInput | string
    mimeType?: StringFieldUpdateOperationsInput | string
    width?: NullableIntFieldUpdateOperationsInput | number | null
    height?: NullableIntFieldUpdateOperationsInput | number | null
    sha256?: StringFieldUpdateOperationsInput | string
    sizeBytes?: BigIntFieldUpdateOperationsInput | bigint | number
    cloudinaryFolder?: NullableStringFieldUpdateOperationsInput | string | null
    cloudinaryPublicId?: NullableStringFieldUpdateOperationsInput | string | null
    cloudinaryAssetId?: NullableStringFieldUpdateOperationsInput | string | null
    cloudinaryVersion?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
    cloudinaryFormat?: NullableStringFieldUpdateOperationsInput | string | null
    cloudinaryUrl?: NullableStringFieldUpdateOperationsInput | string | null
    duplicateOf?: NullableStringFieldUpdateOperationsInput | string | null
    uploadStatus?: StringFieldUpdateOperationsInput | string
    processingStatus?: StringFieldUpdateOperationsInput | string
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    uploadedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type MonitorScreenshotUncheckedUpdateManyWithoutBatchInput = {
    id?: StringFieldUpdateOperationsInput | string
    organizationId?: NullableStringFieldUpdateOperationsInput | string | null
    employeeId?: StringFieldUpdateOperationsInput | string
    deviceId?: StringFieldUpdateOperationsInput | string
    clientScreenshotId?: StringFieldUpdateOperationsInput | string
    capturedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    originalFileName?: StringFieldUpdateOperationsInput | string
    mimeType?: StringFieldUpdateOperationsInput | string
    width?: NullableIntFieldUpdateOperationsInput | number | null
    height?: NullableIntFieldUpdateOperationsInput | number | null
    sha256?: StringFieldUpdateOperationsInput | string
    sizeBytes?: BigIntFieldUpdateOperationsInput | bigint | number
    cloudinaryFolder?: NullableStringFieldUpdateOperationsInput | string | null
    cloudinaryPublicId?: NullableStringFieldUpdateOperationsInput | string | null
    cloudinaryAssetId?: NullableStringFieldUpdateOperationsInput | string | null
    cloudinaryVersion?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
    cloudinaryFormat?: NullableStringFieldUpdateOperationsInput | string | null
    cloudinaryUrl?: NullableStringFieldUpdateOperationsInput | string | null
    duplicateOf?: NullableStringFieldUpdateOperationsInput | string | null
    uploadStatus?: StringFieldUpdateOperationsInput | string
    processingStatus?: StringFieldUpdateOperationsInput | string
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    uploadedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}