// Teste básico para verificar se Jest está funcionando
describe('Testes Básicos', () => {
  test('deve somar dois números', () => {
    expect(1 + 1).toBe(2);
  });

  test('deve verificar se string contém texto', () => {
    expect('Stellar Stake House').toContain('Stellar');
  });

  test('deve verificar se array contém elemento', () => {
    const fruits = ['apple', 'banana', 'orange'];
    expect(fruits).toContain('banana');
  });

  test('deve verificar se objeto tem propriedade', () => {
    const user = { name: 'João', age: 30 };
    expect(user).toHaveProperty('name');
    expect(user.name).toBe('João');
  });

  test('deve verificar se função é chamada', () => {
    const mockFn = jest.fn();
    mockFn('test');
    expect(mockFn).toHaveBeenCalledWith('test');
  });
});