namespace Teleagents.Api.Helpers;

public sealed class Result
{
    public bool IsSuccess { get; }
    public IReadOnlyList<string> Errors { get; }

    public bool IsFailure => !IsSuccess;

    private Result(bool isSuccess, IReadOnlyList<string> errors)
    {
        IsSuccess = isSuccess;
        Errors = errors;
    }

    public static Result Success() => new(true, []);

    public static Result Failure(string error) => new(false, [error]);

    public static Result Failure(IEnumerable<string> errors)
    {
        var list = errors?.ToArray() ?? [];
        return new Result(false, list);
    }

    public static implicit operator Result(string error) => Failure(error);
}

public sealed class Result<T>
{
    public bool IsSuccess { get; }
    public IReadOnlyList<string> Errors { get; }
    public T? Value { get; }

    public bool IsFailure => !IsSuccess;

    private Result(bool isSuccess, T? value, IReadOnlyList<string> errors)
    {
        IsSuccess = isSuccess;
        Value = value;
        Errors = errors;
    }

    public static Result<T> Success(T value) => new(true, value, []);

    public static Result<T> Failure(string error) => new(false, default, [error]);

    public static Result<T> Failure(IEnumerable<string> errors)
    {
        var list = errors?.ToArray() ?? [];
        return new Result<T>(false, default, list);
    }

    public static implicit operator Result<T>(T value) => Success(value);

    public static implicit operator Result<T>(string error) => Failure(error);
}

public static class ResultExtensions
{
    public static Result<TOut> Bind<TIn, TOut>(
        this Result<TIn> result,
        Func<TIn, Result<TOut>> next
    )
    {
        return result.IsFailure ? Result<TOut>.Failure(result.Errors) : next(result.Value!);
    }
}
