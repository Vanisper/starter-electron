/**
 * 规范化捕获到的错误
 * @param err - catch 块捕获到的 unknown 类型错误。
 * @param ErrorType - 期望的错误类型构造函数，默认为 Error。
 * @returns 规范化后的错误实例。
 */
function normalizeError<E extends Error>(err: unknown, ErrorType: new (...args: any[]) => E = Error as any): E {
  if (err instanceof ErrorType) {
    // 如果错误已经是目标类型（或其子类），则直接返回
    return err;
  }

  if (err instanceof Error) {
    return err as E;
  }

  return new ErrorType(`An unknown error occurred: ${String(err)}`);
}

/**
 * 安全地执行一个 Promise，将结果封装为 [error, data] 格式。
 * @template T 成功时的返回值类型
 * @template E 期望捕获的错误类型，必须继承自 Error，默认为 Error
 * @param promise 待执行的 Promise
 * @returns `Promise<[E | null, T | null]>`
 */
export async function safeRequest<T, E extends Error = Error>(
  promise: Promise<T>,
  ErrorType?: new (...args: any[]) => E
): Promise<[E | null, T | null]> {
  try {
    const data = await promise;
    return [null, data];
  } catch (err) {
    // 规范化错误类型
    const errorInstance = normalizeError<E>(err, ErrorType);
    return [errorInstance, null];
  }
}
