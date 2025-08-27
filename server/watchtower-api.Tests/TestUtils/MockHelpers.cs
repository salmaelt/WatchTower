namespace WatchtowerApi.Tests.TestUtils
{
    public static class MockHelpers
    {
        public static Moq.Mock<T> CreateMock<T>() where T : class
        {
            return new Moq.Mock<T>();
        }
    }
}
